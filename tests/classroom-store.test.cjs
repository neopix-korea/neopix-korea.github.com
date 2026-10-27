const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('make/classroom-store.js', 'utf8')
  .replace(/^import .*;\r?\n/, '').replace('export async function', 'async function')
  .replaceAll('import(', 'sdkImport(');

async function setup() {
  const records = new Map(), uploaded = new Set();
  let counter = 0, rejectSubmission = false;
  const accounts = new Map();
  const auth = { currentUser: { uid: 'device-one', isAnonymous: true, providerData: [] }, authStateReady: async () => {} };
  let lastQuery;
  const snapshot = key => ({ exists: () => records.has(key), data: () => records.get(key) });
  const write = async (key, data) => {
    if (key.includes('/submissions/') && rejectSubmission) throw Error('server rejected submission');
    records.set(key, { ...data });
  };
  const sdk = {
    app: { initializeApp: () => ({}) },
    auth: {
      getAuth: () => auth, getIdTokenResult: async () => ({ claims: {} }),
      setPersistence: async () => {},
      EmailAuthProvider: { credential: (email, password) => ({ email, password }) },
      linkWithCredential: async (user, credential) => {
        if (accounts.has(credential.email)) throw Error('duplicate auth account');
        accounts.set(credential.email, { uid: user.uid, password: credential.password });
        auth.currentUser = { uid: user.uid, email: credential.email, isAnonymous: false, providerData: [{ providerId: 'password' }] };
      },
      signInWithEmailAndPassword: async (_, email, password) => {
        const account = accounts.get(email);
        if (!account || account.password !== password) throw Error('invalid credentials');
        auth.currentUser = { uid: account.uid, email, isAnonymous: false, providerData: [{ providerId: 'password' }] };
      },
    },
    firestore: {
      getFirestore: () => ({}), doc: (_, path) => path || `bootcampClassrooms/test/submissions/sub-${++counter}`,
      collection: (_, path) => path, getDoc: async key => snapshot(key),
      runTransaction: async (_, run) => run({ get: async key => snapshot(key), set: (key, value) => records.set(key, { ...value }) }),
      setDoc: write, updateDoc: async (key, data) => records.set(key, { ...records.get(key), ...data }),
      serverTimestamp: () => 'server-time',
      where: (field, op, value) => ({ field, op, value }),
      query: (source, filter) => ({ source, filter }),
      onSnapshot: (source) => { lastQuery = source; return () => {}; },
    },
    storage: {
      getStorage: () => ({}), ref: (_, path) => path,
      uploadBytes: async path => uploaded.add(path), deleteObject: async path => uploaded.delete(path),
      getDownloadURL: async path => 'https://firebasestorage.googleapis.com/v0/b/test/o/' + encodeURIComponent(path),
    },
  };
  const sdkImport = async url => sdk[url.match(/firebase-(app|auth|firestore|storage)\.js$/)[1]];
  const connect = new Function('classroomConfig', 'sdkImport', source + '\nreturn connectClassroom;')(
    { firebase: { apiKey: 'test', projectId: 'test' }, roomId: 'test', professorEmails: [] }, sdkImport);
  return { store: await connect(), auth, records, uploaded, getQuery: () => lastQuery, reject: () => { rejectSubmission = true; } };
}

test('remember identity on device; seat changes preserve submission history', async () => {
  const env = await setup();
  const first = await env.store.register('student12', '테스트 수강생', 12, 'test-only-password');
  assert.equal((await env.store.device()).studentId, 'student12');
  await env.store.submit({ assignmentId: 'task', identity: first, kind: 'website', url: 'https://example.github.io/', description: '', files: [] });
  env.auth.currentUser = { uid: 'replacement-pc', isAnonymous: true, providerData: [] };
  assert.equal(await env.store.device(), null);
  await env.store.enter('student12', 24, 'test-only-password');
  assert.equal(env.auth.currentUser.uid, 'device-one');
  assert.equal((await env.store.device()).seat, 24);
  const old = [...env.records.values()].find(row => row.kind === 'website');
  assert.equal(old.studentId, 'student12');
  assert.equal(old.seat, 12);
});

test('same identity on smartphone reuses registration and duplicate ID is rejected', async () => {
  const env = await setup();
  await env.store.register('student12', '테스트 수강생', 12, 'test-only-password');
  env.auth.currentUser = { uid: 'smartphone', isAnonymous: true, providerData: [] };
  assert.equal((await env.store.enter('student12', 12, 'test-only-password')).name, '테스트 수강생');
  await assert.rejects(env.store.register('student12', '다른 사람', 4, 'test-only-password'), /이미 사용 중/);
  assert.equal(env.records.get('bootcampClassrooms/test/students/student12').name, '테스트 수강생');
});

test('failed document save never reports success and removes its uploaded images', async () => {
  const env = await setup();
  const identity = await env.store.register('student12', '테스트 수강생', 12, 'test-only-password');
  env.reject();
  await assert.rejects(env.store.submit({ assignmentId: 'task', identity, kind: 'image', url: '', description: '', files: [{ type: 'image/png' }] }), /server rejected/);
  assert.equal(env.uploaded.size, 0);
  assert.equal([...env.records.values()].filter(row => row.kind).length, 0);
});

test('choosing another ID without its password does not grant entry', async () => {
  const env = await setup();
  await env.store.register('student12', '테스트 수강생', 12, 'test-only-password');
  env.auth.currentUser = { uid: 'other-student', isAnonymous: true, providerData: [] };
  await assert.rejects(env.store.enter('student12', 55, 'incorrect-password'), /invalid credentials/);
  await assert.rejects(env.store.enter('student12', 55), /비밀번호/);
  assert.equal(env.records.has('bootcampClassrooms/test/devices/other-student'), false);
});

test('student feed follows the profile owned by the authenticated account', async () => {
  const env = await setup();
  await env.store.register('student12', '테스트 수강생', 12, 'test-only-password');
  env.store.watch('submissions', () => {}, () => {}, true);
  assert.deepEqual(env.getQuery().filter, { field: 'studentId', op: '==', value: 'student12' });
  env.auth.currentUser = { uid: 'guest', isAnonymous: true, providerData: [] };
  assert.throws(() => env.store.watch('submissions', () => {}, () => {}, true), /로그인/);
  env.store.watch('submissions', () => {}, () => {}, false);
  assert.equal(env.getQuery(), 'bootcampClassrooms/test/submissions');
});

test('legacy device selection cannot impersonate the owner of an existing ID', async () => {
  const env = await setup();
  await env.store.register('student12', '테스트 수강생', 12, 'test-only-password');
  env.auth.currentUser = { uid: 'other-device', isAnonymous: true, providerData: [] };
  env.records.set('bootcampClassrooms/test/devices/other-device', { studentId: 'student12', seat: 12 });
  assert.equal(await env.store.device(), null);
  await assert.rejects(env.store.activate({ studentId: 'student12', seat: 12 }, 'test-only-password'), /처음 아이디를 만든/);
});
