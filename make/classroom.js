import { connectClassroom } from './classroom-store.js?v=20261027-password-four';
import { classroomConfig } from './classroom-config.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const kindNames = { website: '홈페이지', music: 'Suno 음악', image: '이미지' };
const stamp = item => item.createdAt?.toMillis?.() || 0;
function safeUrl(value) {
  if (!value.trim()) return '';
  const url = new URL(value.trim());
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('http 또는 https로 시작하는 작품 주소를 입력해 주세요.');
  return url.href;
}
function message(error) {
  const code = error?.code || '';
  if (/permission-denied|unauthorized/.test(code)) return '접근 권한을 확인할 수 없습니다. 교수님께 Firebase 권한 설정을 확인해 달라고 요청해 주세요.';
  if (/invalid-credential|wrong-password|user-not-found/.test(code)) return '아이디 또는 비밀번호를 확인해 주세요.';
  if (/email-already-in-use|credential-already-in-use/.test(code)) return '이미 등록된 아이디입니다. 기존 아이디와 비밀번호로 로그인해 주세요.';
  if (/weak-password/.test(code)) return '비밀번호는 4자 이상으로 입력해 주세요.';
  if (/popup-blocked/.test(code)) return 'Google 로그인 창을 열 수 없습니다. 브라우저에서 팝업을 허용해 주세요.';
  if (/popup-closed-by-user|cancelled-popup-request/.test(code)) return 'Google 로그인이 취소되었습니다. 다시 로그인해 주세요.';
  if (/network|unavailable/.test(code)) return '서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.';
  if (/operation-not-allowed/.test(code)) return 'Firebase 로그인 방식이 아직 설정되지 않았습니다.';
  return error?.message || '처리하지 못했습니다. 다시 시도해 주세요.';
}

let connection;
let dispose = () => {};
async function mount() {
  dispose();
  const root = document.querySelector('#classroom-root');
  if (!root) return;
  const subscriptions = [];
  let active = true, store, teacher = false, identity = null;
  let students = [], assignments = [], submissions = [], unsubscribeSubmissions;
  let imagePreviews = [], reviewId = null, filterId = '', serverConnected = false, submitting = false;
  const projector = new URLSearchParams(location.search).has('screen');
  const modal = document.createElement('dialog');
  modal.className = 'work-review-dialog';
  modal.setAttribute('aria-label', '제출물 크게 보기');
  document.body.append(modal);
  dispose = () => {
    active = false;
    subscriptions.forEach(stop => stop());
    unsubscribeSubmissions?.();
    imagePreviews.forEach(URL.revokeObjectURL);
    modal.remove();
    document.body.classList.remove('classroom-screen');
  };
  root.innerHTML = `<div class="work-heading"><div><div class="eyebrow">MAKE · PRACTICE STUDIO</div><h2>실습 과제와 작품 제출</h2><p>만든 홈페이지와 음악, 이미지를 제출하고 함께 살펴보세요.</p></div><button type="button" data-action="teacher" class="work-button secondary">교수 로그인</button></div><p class="work-status" role="status" aria-live="polite">제출 서버 연결 확인 중…</p><div class="work-main"></div>`;
  const main = root.querySelector('.work-main');
  const status = root.querySelector('.work-status');
  function notify(text, error = false) { status.textContent = text; status.classList.toggle('is-error', error); }
  function fail(error) { notify(message(error), true); }
  function currentStudent() { return students.find(item => item.id === identity?.studentId); }
  function studentOptions() {
    return '<option value="">본인 아이디를 선택하세요</option>' + students.map(item => `<option value="${esc(item.id)}">${esc(item.id)} · ${esc(item.name)}</option>`).join('');
  }
  function entryMarkup() {
    return `<div class="work-entry"><div><h3>한 번 로그인하면 이 기기에서 기억해요</h3><p>스마트폰과 PC에서 같은 아이디를 사용하세요. 아이디 선택 후 비밀번호로 로그인하세요. 다음 제출부터는 이 기기에서 자동으로 입장하며, 본인 제출물만 확인할 수 있습니다.</p></div><aside class="work-seat-guide" id="work-seat-guide"><strong>스마트폰으로 접속하셨나요?</strong><p>좌석번호는 첫날 배정받은 <b>실습용 PC의 좌석번호</b>입니다. 스마트폰에서도 PC에서 사용한 번호와 똑같이 입력하세요. 번호를 모르면 임의로 입력하지 말고 교수님께 확인해 주세요.</p><p>PC 고장 등으로 자리를 옮겼다면 <b>이동한 PC의 새 좌석번호</b>를 입력하세요. 아이디는 기존 것을 그대로 사용합니다.</p></aside><form id="work-enter"><label>기존 아이디${identity && store.studentAuthenticated ? `<input name="studentId" value="${esc(identity.studentId)}" readonly>` : `<select name="studentId" required>${studentOptions()}</select>`}</label>${identity && store.studentAuthenticated ? '' : '<label>비밀번호<input name="password" type="password" minlength="4" required autocomplete="current-password"></label>'}<label>실습용 PC 좌석번호<input aria-describedby="work-seat-guide" name="seat" inputmode="numeric" type="number" min="1" max="999" required placeholder="예: 12"></label><button class="work-button">${identity && store.studentAuthenticated ? '좌석 변경 저장' : '학생 로그인'}</button></form><details class="work-register"><summary>처음이라면 · 내 아이디 만들기</summary><form id="work-register"><label>사용할 아이디<input name="studentId" minlength="2" maxlength="24" pattern="[a-zA-Z0-9가-힣_-]{2,24}" required placeholder="예: hong12" autocapitalize="none" spellcheck="false"></label><label>이름<input name="name" maxlength="30" required autocomplete="name"></label><label>비밀번호<input name="password" type="password" minlength="4" required autocomplete="new-password" placeholder="4자 이상"></label><label>비밀번호 확인<input name="passwordConfirm" type="password" minlength="4" required autocomplete="new-password"></label><label>실습용 PC 좌석번호<input aria-describedby="work-seat-guide" name="seat" type="number" min="1" max="999" required inputmode="numeric"></label><button class="work-button">등록하고 로그인</button></form><p>아이디는 한글·영문·숫자·밑줄·하이픈 2~24자로 만들어 주세요.</p></details></div>`;
  }
  function assignmentOptions() {
    return assignments.filter(item => item.open).map(item => `<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('');
  }
  function render() {
    if (!active) return;
    const student = currentStudent();
    if (student) identity.name = student.name;
    root.querySelector('[data-action="teacher"]').textContent = teacher ? '교수 로그아웃' : '교수 로그인';
    document.body.classList.toggle('classroom-screen', teacher && projector);
    if (teacher) {
      main.innerHTML = `<div class="work-teacher-tools"><strong>교수 전용 · 과제 관리</strong><a class="work-button secondary" href="make/index.html?screen=1#classroom-root" target="_blank" rel="noopener">스크린 화면 열기 ↗</a></div><details class="work-publish"><summary>＋ 새 과제 출제</summary><form id="work-publish"><label>과제 제목<input name="title" required maxlength="120" placeholder="예: 나만의 홈페이지 만들기"></label><label>과제 안내<textarea name="description" required maxlength="4000" rows="4"></textarea></label><button class="work-button">과제 공개</button></form></details><div class="work-assignment-list"></div><div class="work-board-heading"><h3>실시간 제출 현황 <span class="work-total"></span></h3><label>과제별 보기<select id="work-filter"><option value="">모든 과제</option>${assignments.map(item => `<option value="${esc(item.id)}">${esc(item.title)}</option>`).join('')}</select></label></div><div class="work-feed"></div>`;
      main.querySelector('#work-filter').value = filterId;
    } else if (identity && !store.studentAuthenticated) {
      main.innerHTML = `<form id="work-activate" class="work-login"><h3>기존 아이디에 비밀번호 설정</h3><p class="work-help">${esc(identity.name)} · ${esc(identity.studentId)}<br>본인 제출물만 확인할 수 있도록 이 아이디를 처음 만든 기기에서 비밀번호를 설정해 주세요. 이후 다른 기기에서도 같은 아이디와 비밀번호로 로그인할 수 있습니다.</p><label>비밀번호<input name="password" type="password" minlength="4" required autocomplete="new-password" placeholder="4자 이상"></label><label>비밀번호 확인<input name="passwordConfirm" type="password" minlength="4" required autocomplete="new-password"></label><button class="work-button">비밀번호 설정하고 로그인</button><button type="button" data-action="student-logout" class="work-button secondary">다른 아이디로 로그인</button></form>`;
    } else if (!identity) {
      main.innerHTML = entryMarkup();
    } else {
      main.innerHTML = `<div class="work-identity"><div><strong>${esc(identity.name)} <span>${esc(identity.studentId)}</span></strong><p>실습용 PC ${esc(identity.seat)}번 좌석 · 이 브라우저에서 입장 정보를 기억합니다.</p><p>스마트폰에서도 배정받은 PC의 좌석번호를 사용합니다. 자리를 옮겼다면 ‘좌석 변경’에서 새 좌석번호를 입력해 주세요.</p></div><div class="work-identity-actions"><button class="work-button secondary" type="button" data-action="change">좌석 변경</button><button class="work-button secondary" type="button" data-action="student-logout">학생 로그아웃</button></div></div><div class="work-assignment-list"></div><form id="work-submit"><h3>작품 제출하기</h3><label>제출할 과제<select name="assignmentId" required>${assignmentOptions() || '<option value="">현재 제출 가능한 과제가 없습니다</option>'}</select></label><label>작품 유형<select name="kind"><option value="website">홈페이지 · GitHub Pages 등</option><option value="music">음악 · Suno 공유 링크</option>${classroomConfig.imageUploadsEnabled ? '<option value="image">이미지 작품</option>' : ''}</select></label><label>결과물 주소<input name="url" type="url" maxlength="2000" placeholder="https://…" inputmode="url"></label><label>작품 설명<textarea name="description" rows="3" maxlength="2000" placeholder="어떤 결과물을 만들었나요?"></textarea></label>${classroomConfig.imageUploadsEnabled ? `<label class="work-upload">이미지 첨부<input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple><span>최대 3장 · 장당 5MB · JPG, PNG, WebP, GIF</span></label><div class="work-previews"></div>` : '<p class="work-help">이미지 첨부는 준비 중입니다. 현재는 홈페이지·Suno 공유 링크로 제출해 주세요.</p>'}<p class="work-help">${classroomConfig.imageUploadsEnabled ? '주소 또는 이미지를 하나 이상 제출하세요.' : '완성한 작품의 공유 주소를 입력해 주세요.'} 제출물은 교수님과 수업 스크린에서 함께 검토합니다. 음악은 교수님 PC에서 선택해 재생합니다.</p><button class="work-button" ${assignments.some(item => item.open) ? '' : 'disabled'}>과제 제출</button></form><div class="work-board-heading"><h3>내 제출 내역</h3></div><div class="work-feed"></div>`;
    }
    renderAssignments(); renderFeed();
  }
  function renderAssignments() {
    const area = main.querySelector('.work-assignment-list');
    if (!area) return;
    area.innerHTML = assignments.length ? assignments.map(item => `<article class="work-assignment"><div class="work-assignment-top"><h3>${esc(item.title)}</h3><span class="work-badge ${item.open ? '' : 'closed'}">${item.open ? '제출 가능' : '마감'}</span></div><p>${esc(item.description)}</p>${teacher ? `<button type="button" class="work-button secondary" data-toggle-assignment="${esc(item.id)}">${item.open ? '제출 마감' : '다시 열기'}</button>` : ''}</article>`).join('') : '<p class="work-empty">교수님이 과제를 공개하면 여기에 표시됩니다.</p>';
  }
  function renderFeed() {
    const feed = main.querySelector('.work-feed');
    if (!feed) return;
    const filtered = submissions.filter(item => !teacher || !filterId || item.assignmentId === filterId);
    const total = main.querySelector('.work-total');
    if (total) total.textContent = `${filtered.length}개 작품 · ${new Set(filtered.map(item => item.studentId)).size}명 제출`;
    feed.innerHTML = filtered.length ? filtered.map(item => {
      let link = '';
      try { link = safeUrl(item.url || ''); } catch {}
      const task = assignments.find(task => task.id === item.assignmentId);
      const time = stamp(item) ? new Date(stamp(item)).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '서버 확인 중';
      return `<article class="work-card"><div class="work-assignment-top"><span class="work-badge">${esc(kindNames[item.kind] || '작품')}</span><time>${esc(time)}</time></div><h4>${esc(item.name)} <span>${esc(item.seat)}번 좌석 · ${esc(item.studentId)}</span></h4><p class="work-card-task">${esc(task?.title || '과제')}</p><p class="work-description">${esc(item.description)}</p>${item.images?.length ? `<button class="work-image-button" type="button" data-review="${esc(item.id)}"><span data-image-path="${esc(item.images[0])}">이미지 불러오는 중…</span><span>이미지 ${item.images.length}장 · 크게 보기 ⤢</span></button>` : ''}${link ? `<a class="work-button secondary" href="${esc(link)}" target="_blank" rel="noopener noreferrer">${item.kind === 'music' ? 'Suno에서 열기 · 교수 PC에서 재생 ↗' : '홈페이지 열기 ↗'}</a>` : ''}</article>`;
    }).join('') : '<p class="work-empty">아직 제출된 작품이 없습니다.</p>';
    loadImages(feed);
  }
  const imageCache = new Map();
  async function loadImages(area) {
    for (const holder of area.querySelectorAll('[data-image-path]')) {
      try {
        const path = holder.dataset.imagePath;
        if (!imageCache.has(path)) imageCache.set(path, store.imageUrl(path).catch(error => { imageCache.delete(path); throw error; }));
        const url = await imageCache.get(path);
        if (!active || !holder.isConnected) continue;
        const image = new Image(); image.src = url; image.alt = '제출한 작품 이미지'; image.loading = 'lazy';
        holder.replaceChildren(image);
      } catch { holder.textContent = '이미지를 불러오지 못했습니다.'; }
    }
  }
  function watchSubmissions() {
    unsubscribeSubmissions?.();
    submissions = [];
    if (!teacher && (!identity || !store.studentAuthenticated)) return;
    unsubscribeSubmissions = store.watch('submissions', (rows, live) => {
      submissions = rows.sort((a, b) => stamp(b) - stamp(a));
      serverConnected = live;
      notify(live ? '서버 연결됨 · 제출 내역이 실시간으로 갱신됩니다.' : '서버 연결 확인 중 · 표시된 내역은 최신이 아닐 수 있습니다.');
      renderFeed();
    }, fail, !teacher);
  }
  async function perform(form, task) {
    if (form.id === 'work-submit' && submitting) return;
    const button = form.querySelector('button[type="submit"], button:not([type])');
    if (button?.disabled) return;
    if (button) button.disabled = true;
    if (form.id === 'work-submit') submitting = true;
    try { await task(); } catch (error) { fail(error); }
    finally {
      if (form.id === 'work-submit') submitting = false;
      if (button?.isConnected) button.disabled = form.id === 'work-submit' && !assignments.some(item => item.open);
    }
  }
  root.addEventListener('submit', async event => {
    const form = event.target;
    event.preventDefault();
    if (!store) return;
    await perform(form, async () => {
      const data = new FormData(form);
      if (form.id === 'work-activate') {
        if (data.get('password') !== data.get('passwordConfirm')) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        identity = await store.activate(identity, data.get('password'));
        render(); watchSubmissions(); notify('비밀번호를 설정했습니다. 본인 제출물만 확인할 수 있습니다.');
      } else if (form.id === 'work-enter' || form.id === 'work-register') {
        const studentId = data.get('studentId').trim().toLowerCase();
        const seat = Number(data.get('seat'));
        if (form.id === 'work-register' && data.get('password') !== data.get('passwordConfirm')) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        identity = form.id === 'work-register' ? await store.register(studentId, data.get('name').trim(), seat, data.get('password')) : await store.enter(studentId, seat, data.get('password'));
        render(); watchSubmissions(); notify(`${identity.name}님으로 입장했습니다. 다음부터 이 브라우저에서 바로 제출할 수 있습니다.`);
      } else if (form.id === 'work-publish') {
        await store.publish(data.get('title').trim(), data.get('description').trim());
        form.reset(); notify('과제를 공개했습니다. 학생 화면에 바로 표시됩니다.');
      } else if (form.id === 'work-login') {
        notify('Google 로그인 창에서 교수 계정을 선택해 주세요. 창이 보이지 않으면 브라우저의 팝업 허용을 확인해 주세요.');
        await store.login();
        teacher = true; identity = null; render(); watchSubmissions(); notify('교수 계정으로 로그인했습니다.');
      } else if (form.id === 'work-submit') {
        if (!navigator.onLine || !serverConnected) throw new Error('서버 연결 후 제출해 주세요. 입력한 내용은 현재 화면에 유지됩니다.');
        const files = [...(form.querySelector('[name="images"]')?.files || [])];
        checkFiles(files);
        const url = safeUrl(data.get('url'));
        const kind = data.get('kind');
        if (!url && !files.length) throw new Error('결과물 주소나 이미지를 하나 이상 입력해 주세요.');
        if (kind === 'music' && (!url || !/^(www\.)?suno\.(com|ai)$/.test(new URL(url).hostname))) throw new Error('음악은 Suno에서 복사한 공유 링크를 입력해 주세요.');
        notify('작품을 업로드하고 서버에 저장하는 중입니다. 창을 닫지 마세요.');
        await store.submit({ assignmentId: data.get('assignmentId'), identity, kind, url, description: data.get('description').trim(), files });
        form.reset(); clearPreviews(); notify('제출이 완료되었습니다. 교수 화면에 작품이 전달되었습니다.');
      }
    });
  });
  function checkFiles(files) {
    if (files.length > 3) throw new Error('이미지는 최대 3장까지 첨부해 주세요.');
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('JPG, PNG, WebP, GIF 이미지만 첨부할 수 있습니다.');
      if (file.size > 5 * 1024 * 1024) throw new Error('이미지 한 장의 크기는 5MB 이하여야 합니다.');
    }
  }
  function clearPreviews() {
    imagePreviews.forEach(URL.revokeObjectURL); imagePreviews = [];
    main.querySelector('.work-previews')?.replaceChildren();
  }
  root.addEventListener('change', event => {
    if (event.target.id === 'work-filter') { filterId = event.target.value; renderFeed(); }
    if (event.target.name === 'images') {
      clearPreviews();
      try {
        const files = [...event.target.files]; checkFiles(files);
        for (const file of files) {
          const url = URL.createObjectURL(file); imagePreviews.push(url);
          const image = new Image(); image.src = url; image.alt = file.name;
          main.querySelector('.work-previews').append(image);
        }
      } catch (error) { event.target.value = ''; fail(error); }
    }
  });
  root.addEventListener('click', async event => {
    const button = event.target.closest('button');
    if (!button || !store) return;
    try {
      if (button.dataset.action === 'teacher') {
        if (teacher) {
          unsubscribeSubmissions?.(); await store.logout(); teacher = false; identity = await store.device(); render(); watchSubmissions();
        } else {
          main.innerHTML = `<form id="work-login" class="work-login"><h3>교수 로그인</h3><p class="work-help">기존 교수 계정 ${esc(classroomConfig.professorEmails.join(', '))}으로 로그인하세요.</p><button class="work-button">Google 계정으로 교수 로그인</button><button class="work-button secondary" type="button" data-action="cancel">학생 화면으로</button></form>`;
        }
      } else if (button.dataset.action === 'student-logout') {
        unsubscribeSubmissions?.(); submissions = [];
        await store.logout(); teacher = false; identity = null; render(); notify('로그아웃했습니다. 본인 아이디와 비밀번호로 다시 로그인할 수 있습니다.');
      } else if (button.dataset.action === 'change') {
        main.innerHTML = entryMarkup();
        main.querySelector('#work-enter [name="studentId"]').value = identity.studentId;
        main.querySelector('#work-enter [name="seat"]').value = identity.seat;
      } else if (button.dataset.action === 'cancel') render();
      else if (button.dataset.toggleAssignment) {
        button.disabled = true;
        const item = assignments.find(item => item.id === button.dataset.toggleAssignment);
        await store.setOpen(item.id, !item.open);
      } else if (button.dataset.review) {
        reviewId = button.dataset.review;
        const item = submissions.find(item => item.id === reviewId);
        modal.innerHTML = `<button type="button" class="work-button secondary" data-close>닫기 ×</button><h2>${esc(item.name)} · ${esc(item.seat)}번 좌석</h2><p>${esc(item.description)}</p>${item.images.map(path => `<div data-image-path="${esc(path)}">이미지 불러오는 중…</div>`).join('')}`;
        modal.showModal(); loadImages(modal);
      }
    } catch (error) { button.disabled = false; fail(error); }
  });
  modal.addEventListener('click', event => { if (event.target.closest('[data-close]')) modal.close(); });
  try {
    connection ??= connectClassroom().catch(error => { connection = null; throw error; });
    store = await connection;
    if (!active) return;
    if (!store) {
      notify('과제 제출 공간 준비 중 · Firebase 연결을 설정하면 입장과 제출이 시작됩니다.');
      root.querySelector('[data-action="teacher"]').disabled = true;
      main.innerHTML = '<div class="work-empty">스마트폰·PC에서 한 번 입장하면 아이디를 기억합니다.<br>자리 이동 시 기존 아이디와 현재 좌석으로 다시 입장할 수 있습니다.</div>';
      return;
    }
    teacher = await store.isTeacher();
    identity = teacher ? null : await store.device();
    subscriptions.push(store.watch('students', rows => {
      students = rows.sort((a, b) => a.id.localeCompare(b.id, 'ko'));
      if (!main.children.length) render();
      // Update the roster without overwriting a draft or a student's typed seat.
      const select = main.querySelector('#work-enter select[name="studentId"]');
      if (select) { const value = select.value; select.innerHTML = studentOptions(); select.value = value; }
    }, fail));
    subscriptions.push(store.watch('assignments', (rows, live) => {
      assignments = rows.sort((a, b) => stamp(b) - stamp(a));
      serverConnected = live;
      if (!main.children.length) render();
      renderAssignments();
      const select = main.querySelector('#work-submit [name="assignmentId"]');
      if (select) {
        const value = select.value; select.innerHTML = assignmentOptions() || '<option value="">현재 제출 가능한 과제가 없습니다</option>';
        if (assignments.some(item => item.id === value && item.open)) select.value = value;
        main.querySelector('#work-submit button').disabled = submitting || !assignments.some(item => item.open);
      }
      const filter = main.querySelector('#work-filter');
      if (filter) { filter.innerHTML = '<option value="">모든 과제</option>' + assignments.map(item => `<option value="${esc(item.id)}">${esc(item.title)}</option>`).join(''); filter.value = filterId; }
      renderFeed();
      notify(live ? '서버 연결됨 · 과제가 실시간으로 갱신됩니다.' : '서버 연결 확인 중…');
    }, fail));
    render(); watchSubmissions();
  } catch (error) { fail(error); main.innerHTML = '<p class="work-empty">제출 서버에 연결하지 못했습니다. 잠시 후 페이지를 새로고침해 주세요.</p>'; }
}
mount();
window.addEventListener('hashchange', mount);
