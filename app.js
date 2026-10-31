const app = document.querySelector('#app');
const lessons = [
  ['제1강 - 경영학이란?', 'W6pXKyx7y3c'],
  ['제2강 - 기업이란?', 'NlVWvmfsPR8'],
  ['제3강 - AI 보이스 클론과 디지털 아바타 만들기', 'pqKbNFiGN2o'],
  ['제4강 - AI로 이미지와 영상 만들기', 'uvu4Jxh951I'],
  ['제5강 - AI 협업으로 나만의 디지털 프로필 만들기', 'fR5lsZL1uPY'],
  ['제6강 - AI로 나만의 홈페이지 만들기', 'jV3gYF-eTNk'],
  ['제7강 - Codex와 홈페이지 확장하기', '26ggzPHtsUw'],
  ['제8강 - 홈페이지 등록과 SEO·GEO', 'ISiKzJAX1lg'],
  ['제9강 - Python으로 데이터 분석하기', 'mTUxTboLl50'],
  ['제10강 - Teachable Machine으로 이미지 분류', '66830b1LAGc'],
  ['제11강 - 프롬프트 엔지니어링', 'myDsSueW_GY'],
  ['제12강 - AI의 역사와 Transformer', 'Yt0xewIvPlE'],
  ['제13강 - RAG · 내 자료를 참고하는 AI', 'GpB_J_Osxxk'],
  ['제14강 - AI 오케스트레이션', 'K2_Fo60VOxo'],
  ['제15강 - AI 캡스톤 프로젝트', 'u08UeZcxsOs'],
].map(([title, videoId], index) => ({
  number: index + 1, title: `메이크 ${index + 1}강`, videoId,
  description: '아래에서 강의 영상을 시청하세요.',
  videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
}));

function renderHome() {
  app.innerHTML = `<section class="hero"><div><div class="eyebrow">AI BOOTCAMP · ONLINE CLASSROOM</div><h1>생각을 현실로 만드는<br>인공지능 <em>부트캠프.</em></h1><p class="intro">AI와 함께 만들고, 연결하고, 완성하세요.<br>세 개의 챕터를 따라 나만의 가능성을 넓혀가는 실습 중심 강의입니다.</p></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit second"></div><div class="art-core">AI</div><span class="art-tag tag-one">YOUR IDEAS, REALIZED ↗</span><span class="art-tag tag-two">✳ LEARN BY MAKING</span></div></section><section aria-labelledby="chapters-title"><div class="section-heading"><h2 id="chapters-title">우리의 학습 여정</h2><p>세 단계로 시작하는 AI 활용</p></div><div class="chapter-grid"><a class="chapter" href="make/index.html"><div class="chapter-visual"><span class="chapter-number">CHAPTER 01</span><span class="chapter-icon" aria-hidden="true">✳</span><strong>MAKE</strong></div><div class="chapter-body"><h3>AI로 직접 만들기</h3><p>아이디어를 표현하고 결과물을 만드는 첫걸음.<br>AI를 활용하는 즐거움을 실습으로 경험합니다.</p><div class="chapter-bottom"><span>전체 15강</span><span>강의 목록 보기 ↗</span></div></div></a><article class="chapter"><div class="chapter-visual connect"><span class="chapter-number">CHAPTER 02</span><span class="chapter-icon" aria-hidden="true">⌘</span><strong>CONNECT</strong></div><div class="chapter-body"><h3>도구와 아이디어 연결하기</h3><p>다양한 AI 도구와 작업을 연결하며<br>더 넓은 활용 가능성을 발견합니다.</p><div class="chapter-bottom"><span>다음 학습 단계</span><span class="pill">공개 준비 중</span></div></div></article><article class="chapter"><div class="chapter-visual build"><span class="chapter-number">CHAPTER 03</span><span class="chapter-icon" aria-hidden="true">▧</span><strong>BUILD</strong></div><div class="chapter-body"><h3>나만의 프로젝트 완성하기</h3><p>배운 내용을 하나로 모아<br>나만의 프로젝트를 구체화하고 완성합니다.</p><div class="chapter-bottom"><span>마지막 학습 단계</span><span class="pill">공개 준비 중</span></div></div></article></div><aside class="note"><strong>수강 안내 ↗</strong><span>MAKE 챕터에서 1강부터 15강까지 강의 목록을 확인하세요. 각 강의실에서 강의 영상을 시청할 수 있습니다.</span></aside></section>`;
}

function classroomQr() {
  return `<section class="classroom-qr" aria-labelledby="qr-title"><div><div class="eyebrow">MAKE · CLASSROOM QR</div><h2 id="qr-title">실습을 시작하는 강의실 QR</h2><p>휴대폰 카메라로 QR코드를 스캔해 MAKE 강의실에 접속하세요.</p><a href="https://neopix-korea.github.io/make/index.html">MAKE 강의실 바로가기 ↗</a></div><button class="qr-expand" type="button" aria-haspopup="dialog"><img src="make/classroom-qr.png" width="144" height="144" alt="MAKE 강의실 접속 QR코드"><span>QR코드 확대보기 ⤢</span></button></section><dialog class="qr-dialog" aria-labelledby="qr-dialog-title"><button class="qr-close" type="button" autofocus aria-label="QR코드 확대보기 닫기">닫기 ×</button><h2 id="qr-dialog-title">MAKE 강의실 접속</h2><img src="make/classroom-qr.png" width="640" height="640" alt="https://neopix-korea.github.io/make/index.html 접속 QR코드"><p>휴대폰 카메라로 QR코드를 스캔하세요.</p></dialog>`;
}

function bindClassroomQr() {
  const dialog = app.querySelector('.qr-dialog');
  app.querySelector('.qr-expand').addEventListener('click', () => {
    dialog.showModal();
    document.body.classList.add('qr-open');
  });
  dialog.querySelector('.qr-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => document.body.classList.remove('qr-open'));
}

function renderMake() {
  app.innerHTML = `${classroomQr()}<div class="breadcrumb"><a href="./">강의 소개</a><span>/</span>CHAPTER 01 · MAKE</div><section class="course-hero"><div class="eyebrow">CHAPTER 01 · MAKE</div><h1>AI로 직접 만들기</h1><p class="intro">작은 아이디어를 나만의 결과물로.<br>1강부터 15강까지, AI와 함께 만드는 과정을 차근차근 시작하세요.</p><div class="course-meta"><span>전체 15강</span><span>실습 중심 학습</span><span>강의 영상 15개</span></div><div class="big-word" aria-hidden="true">MAKE</div></section><section id="classroom-root" aria-label="실습 과제 제출"></section><section aria-labelledby="lessons-title"><details class="lessons-disclosure"><summary><h2 id="lessons-title">강의 목록 <span>전체 15강</span></h2><span class="lessons-toggle"><span class="when-closed">펼치기 ＋</span><span class="when-open">접기 −</span></span></summary><div class="lessons-content"><div class="toolbar"><span id="lesson-count">15 LESSONS</span><input class="search" type="search" placeholder="강의 검색 · 예: 1강" aria-label="MAKE 강의 검색"></div><div class="lesson-list" id="lesson-list"></div></div></details></section>`;
  bindClassroomQr();
  renderLessons('');
  app.querySelector('.search').addEventListener('input', event => renderLessons(event.target.value));
}

function renderLessons(query) {
  const filtered = lessons.filter(lesson => `${lesson.title} ${lesson.number}강`.toLowerCase().includes(query.trim().toLowerCase()));
  document.querySelector('#lesson-count').textContent = `${filtered.length} LESSONS`;
  document.querySelector('#lesson-list').innerHTML = filtered.length ? filtered.map(lesson => `<a class="lesson" href="make/${String(lesson.number).padStart(2,'0')}/"><img class="thumbnail lesson-thumbnail" src="make/thumbnails/${String(lesson.number).padStart(2,'0')}.svg" width="960" height="540" alt="MAKE ${lesson.number}강 썸네일" loading="lazy"><div class="lesson-copy"><small>LESSON ${String(lesson.number).padStart(2,'0')}</small><h3>${lesson.title}</h3><p>${lesson.description}</p></div><span class="lesson-status">강의실 입장 ↗</span></a>`).join('') : '<p class="empty">검색한 강의가 없습니다. 다른 검색어를 입력해 주세요.</p>';
}

function route() {
  const chapterMatch = location.pathname.match(/\/(connect|build)\/(?:index\.html)?$/);
  if (chapterMatch) {
    const key = chapterMatch[1];
    const name = key.toUpperCase();
    const title = key === 'connect' ? '도구와 아이디어 연결하기' : '나만의 프로젝트 완성하기';
    document.title = `${name} 강의실 | AI BOOTCAMP`;
    for (const id of ['home-link', 'make-link', 'connect-link', 'build-link']) {
      const link = document.getElementById(id);
      if (id === `${key}-link`) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    app.innerHTML = `<div class="breadcrumb"><a href="./">강의 소개</a><span>/</span>${name}</div><section class="course-hero"><div class="eyebrow">CHAPTER ${key === 'connect' ? '02' : '03'} · ${name}</div><h1>${title}</h1><p class="intro">${name} 강의실입니다. 강의는 준비가 완료되는 대로 공개됩니다.</p></section><div class="empty"><h2>강의 공개 준비 중</h2><p>강의 목록과 학습 자료를 준비하고 있습니다.</p><a class="back-to-lessons" href="./">강의 소개로 돌아가기 ↗</a></div>`;
    window.scrollTo(0, 0);
    return;
  }
  if (location.hash === '#/' || location.hash === '#') {
    location.replace(new URL('./', document.baseURI).href);
    return;
  }
  if (location.hash === '#/make') {
    location.replace(new URL('make/index.html', document.baseURI).href);
    return;
  }
  const lessonMatch = !location.hash && location.pathname.match(/\/make\/(\d{2})\/(?:index\.html)?$/);
  if (lessonMatch) {
    const lesson = lessons.find(item => item.number === Number(lessonMatch[1]));
    if (lesson) {
      document.title = `${lesson.title} | AI BOOTCAMP`;
      document.getElementById('make-link').setAttribute('aria-current', 'page');
      document.getElementById('home-link').removeAttribute('aria-current');
      renderLesson(lesson);
      window.scrollTo(0, 0);
      return;
    }
  }
  const isMake = /\/make\/(?:index\.html)?$/.test(location.pathname);
  document.title = isMake ? 'MAKE · 1–15강 | AI BOOTCAMP' : '인공지능 부트캠프 | 이현구 · 네오픽스코리아';
  for (const [id, active] of [['home-link', !isMake], ['make-link', isMake]]) {
    const link = document.getElementById(id);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
  isMake ? renderMake() : renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();

function renderLesson(lesson) {
  const number = String(lesson.number).padStart(2, '0');
  const neighbor = (value, label) => `<a class="lesson-nav-link" href="make/${String(value).padStart(2, '0')}/">${label} · ${value}강</a>`;
  app.innerHTML = `<div class="breadcrumb"><a href="./">강의 소개</a><span>/</span><a href="make/index.html">MAKE</a><span>/</span>${lesson.number}강</div><section class="course-hero"><div class="eyebrow">CHAPTER 01 · LESSON ${number}</div><h1>${lesson.title}</h1><p class="intro">${lesson.description}</p></section><section class="lesson-room" aria-label="${lesson.title} 강의실"><div><img class="lesson-cover" src="make/thumbnails/${number}.svg" alt="MAKE ${lesson.number}강 썸네일" width="960" height="540"><div class="video-player"><iframe src="https://www.youtube-nocookie.com/embed/${lesson.videoId}" title="${lesson.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><p class="video-external"><a href="${lesson.videoUrl}" target="_blank" rel="noopener noreferrer">YouTube에서 영상 보기 ↗</a></p></div><aside class="lesson-info"><span class="pill">MAKE · ${number} / 15</span><h2>이번 강의 안내</h2><p>${lesson.title}</p><p>강의 영상은 이 페이지에서 시청하거나 YouTube에서 열 수 있습니다.</p><hr><h2>과제 안내</h2><p>과제 내용과 제출 방법은 추후 안내합니다.</p><a class="back-to-lessons" href="make/index.html">전체 15강 목록 보기 ↗</a></aside></section><nav class="lesson-navigation" aria-label="강의 이동">${lesson.number > 1 ? neighbor(lesson.number - 1, '← 이전 강의') : '<span></span>'}<a href="make/index.html">강의 목록</a>${lesson.number < 15 ? neighbor(lesson.number + 1, '다음 강의 →') : '<span></span>'}</nav>`;
}
