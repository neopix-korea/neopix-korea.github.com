const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('make/classroom-store.js', 'utf8')
  .replace(/^import .*;\r?\n/, '').replace('export async function', 'async function')
  .replaceAll('import(', 'sdkImport(');

async function setup() {
  const records = new Map(), uploaded = new Set();
  let counter = 0, rejectSubmission = false;
  const auth = { currentUser: { uid: 'device-one' }, authStateReady: async () => {} };
  const snapshot = key => ({ exists: () => records.has(key), data: () => records.get(key) });
  const write = async (key, data) => {
    if (key.includes('/submissions/') && rejectSubmission) throw Error('server rejected submission');
    records.set(key, { ...data });
  };
  const sdk = {
    app: { initializeApp: () => ({}) },
    auth: { getAuth: () => auth, getIdTokenResult: async () => ({ claims: {} }) },
    firestore: {
      getFirestore: () => ({}), doc: (_, path) => path || `bootcampClassrooms/test/submissions/sub-${++counter}`,
      collection: (_, path) => path, getDoc: async key => snapshot(key),
      runTransaction: async (_, run) => run({ get: async key => snapshot(key), set: (key, value) => records.set(key, { ...value }) }),
      setDoc: write, updateDoc: async (key, data) => records.set(key, { ...records.get(key), ...data }),
      serverTimestamp: () => 'server-time',
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
  return { store: await connect(), auth, records, uploaded, reject: () => { rejectSubmission = true; } };
}

test('remember identity on device; seat changes preserve submission history', async () => {
  const env = await setup();
  const first = await env.store.register('student12', '테스트 수강생', 12);
  assert.equal((await env.store.device()).studentId, 'student12');
  await env.store.submit({ assignmentId: 'task', identity: first, kind: 'website', url: 'https://example.github.io/', description: '', files: [] });
  env.auth.currentUser = { uid: 'replacement-pc' };
  assert.equal(await env.store.device(), null);
  await env.store.enter('student12', 24);
  assert.equal((await env.store.device()).seat, 24);
  const old = [...env.records.values()].find(row => row.kind === 'website');
  assert.equal(old.studentId, 'student12');
  assert.equal(old.seat, 12);
});

test('same identity on smartphone reuses registration and duplicate ID is rejected', async () => {
  const env = await setup();
  await env.store.register('student12', '테스트 수강생', 12);
  env.auth.currentUser = { uid: 'smartphone' };
  assert.equal((await env.store.enter('student12', 12)).name, '테스트 수강생');
  await assert.rejects(env.store.register('student12', '다른 사람', 4), /이미 사용 중/);
  assert.equal(env.records.get('bootcampClassrooms/test/students/student12').name, '테스트 수강생');
});

test('failed document save never reports success and removes its uploaded images', async () => {
  const env = await setup();
  const identity = await env.store.register('student12', '테스트 수강생', 12);
  env.reject();
  await assert.rejects(env.store.submit({ assignmentId: 'task', identity, kind: 'image', url: '', description: '', files: [{ type: 'image/png' }] }), /server rejected/);
  assert.equal(env.uploaded.size, 0);
  assert.equal([...env.records.values()].filter(row => row.kind).length, 0);
});
