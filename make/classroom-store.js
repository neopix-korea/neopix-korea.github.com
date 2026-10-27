import { classroomConfig } from './classroom-config.js';

export async function connectClassroom() {
  if (!classroomConfig.firebase.apiKey || !classroomConfig.firebase.projectId) return null;
  const version = '13.1.0';
  const [appSDK, authSDK, dbSDK, storageSDK] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-storage.js`),
  ]);
  const firebase = appSDK.initializeApp(classroomConfig.firebase, 'make-classroom');
  const auth = authSDK.getAuth(firebase);
  const db = dbSDK.getFirestore(firebase);
  const storage = storageSDK.getStorage(firebase);
  const room = `bootcampClassrooms/${classroomConfig.roomId}`;
  await auth.authStateReady();
  if (!auth.currentUser) await authSDK.signInAnonymously(auth);
  const doc = (path) => dbSDK.doc(db, `${room}/${path}`);
  const rows = (snapshot) => snapshot.docs.map(item => ({ ...item.data(), id: item.id }));
  const store = {
    get user() { return auth.currentUser; },
    async isTeacher() {
      const token = await authSDK.getIdTokenResult(auth.currentUser);
      return token.claims.email_verified === true && classroomConfig.professorEmails.includes(token.claims.email);
    },
    async login() {
      await authSDK.setPersistence(auth, authSDK.browserSessionPersistence);
      const provider = new authSDK.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await authSDK.signInWithPopup(auth, provider);
      if (!await store.isTeacher()) {
        await store.logout();
        throw new Error('교수 권한이 등록되지 않은 계정입니다.');
      }
    },
    async logout() {
      await authSDK.signOut(auth);
      await authSDK.setPersistence(auth, authSDK.browserLocalPersistence);
      await authSDK.signInAnonymously(auth);
    },
    watch(collection, receive, fail, studentId) {
      let source = dbSDK.collection(db, `${room}/${collection}`);
      if (studentId) source = dbSDK.query(source, dbSDK.where('studentId', '==', studentId));
      return dbSDK.onSnapshot(source, { includeMetadataChanges: true }, snapshot => {
        receive(rows(snapshot), !snapshot.metadata.fromCache);
      }, fail);
    },
    async device() {
      const value = await dbSDK.getDoc(doc(`devices/${auth.currentUser.uid}`));
      if (!value.exists()) return null;
      const entry = value.data();
      const student = await dbSDK.getDoc(doc(`students/${entry.studentId}`));
      return student.exists() ? { ...entry, name: student.data().name } : null;
    },
    async enter(studentId, seat) {
      const student = await dbSDK.getDoc(doc(`students/${studentId}`));
      if (!student.exists()) throw new Error('등록된 아이디를 선택해 주세요.');
      const entry = { studentId, seat, updatedAt: dbSDK.serverTimestamp() };
      await dbSDK.setDoc(doc(`devices/${auth.currentUser.uid}`), entry);
      return { studentId, seat, name: student.data().name };
    },
    async register(studentId, name, seat) {
      await dbSDK.runTransaction(db, async transaction => {
        const target = doc(`students/${studentId}`);
        if ((await transaction.get(target)).exists()) throw new Error('이미 사용 중인 아이디입니다. 기존 아이디로 입장해 주세요.');
        transaction.set(target, { name, createdBy: auth.currentUser.uid, createdAt: dbSDK.serverTimestamp() });
      });
      return store.enter(studentId, seat);
    },
    async publish(title, description) {
      await dbSDK.addDoc(dbSDK.collection(db, `${room}/assignments`), {
        title, description, open: true, createdBy: auth.currentUser.uid, createdAt: dbSDK.serverTimestamp(),
      });
    },
    async setOpen(id, open) { await dbSDK.updateDoc(doc(`assignments/${id}`), { open }); },
    async submit({ assignmentId, identity, kind, url, description, files }) {
      const target = dbSDK.doc(dbSDK.collection(db, `${room}/submissions`));
      const uploaded = [];
      const images = [];
      let committed = false;
      try {
        for (const file of files) {
          const path = `${room}/${auth.currentUser.uid}/${target.id}/${crypto.randomUUID()}`;
          const object = storageSDK.ref(storage, path);
          await storageSDK.uploadBytes(object, file, { contentType: file.type });
          uploaded.push(path);
          images.push(await storageSDK.getDownloadURL(object));
        }
        await dbSDK.setDoc(target, {
          assignmentId, studentId: identity.studentId, name: identity.name, seat: identity.seat,
          kind, url, description, images, createdBy: auth.currentUser.uid,
          createdAt: dbSDK.serverTimestamp(),
        });
        committed = true;
      } finally {
        if (!committed) await Promise.allSettled(uploaded.map(path => storageSDK.deleteObject(storageSDK.ref(storage, path))));
      }
    },
    async imageUrl(value) {
      const url = new URL(value);
      if (url.origin !== 'https://firebasestorage.googleapis.com' || !url.pathname.startsWith(`/v0/b/${classroomConfig.firebase.storageBucket}/o/bootcampClassrooms%2F`)) throw new Error('잘못된 작품 이미지 주소입니다.');
      return url.href;
    },
  };
  return store;
}
