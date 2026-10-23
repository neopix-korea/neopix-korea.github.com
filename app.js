const app = document.querySelector('#app');
const lessons = Array.from({length: 15}, (_, index) => ({number: index + 1, title: `MAKE ${index + 1}강`, description: '강의 제목과 소개가 곧 공개됩니다.', videoUrl: null}));

function renderHome() {
  app.innerHTML = `<section class="hero"><div><div class="eyebrow">AI BOOTCAMP · ONLINE CLASSROOM</div><h1>생각을 현실로 만드는<br>인공지능 <em>부트캠프.</em></h1><p class="intro">AI와 함께 만들고, 연결하고, 완성하세요.<br>세 개의 챕터를 따라 나만의 가능성을 넓혀가는 실습 중심 강의입니다.</p></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><div class="orbit second"></div><div class="art-core">AI</div><span class="art-tag tag-one">YOUR IDEAS, REALIZED ↗</span><span class="art-tag tag-two">✳ LEARN BY MAKING</span></div></section><section aria-labelledby="chapters-title"><div class="section-heading"><h2 id="chapters-title">우리의 학습 여정</h2><p>세 단계로 시작하는 AI 활용</p></div><div class="chapter-grid"><a class="chapter" href="make/index.html"><div class="chapter-visual"><span class="chapter-number">CHAPTER 01</span><span class="chapter-icon" aria-hidden="true">✳</span><strong>MAKE</strong></div><div class="chapter-body"><h3>AI로 직접 만들기</h3><p>아이디어를 표현하고 결과물을 만드는 첫걸음.<br>AI를 활용하는 즐거움을 실습으로 경험합니다.</p><div class="chapter-bottom"><span>전체 15강</span><span>강의 목록 보기 ↗</span></div></div></a><article class="chapter"><div class="chapter-visual connect"><span class="chapter-number">CHAPTER 02</span><span class="chapter-icon" aria-hidden="true">⌘</span><strong>CONNECT</strong></div><div class="chapter-body"><h3>도구와 아이디어 연결하기</h3><p>다양한 AI 도구와 작업을 연결하며<br>더 넓은 활용 가능성을 발견합니다.</p><div class="chapter-bottom"><span>다음 학습 단계</span><span class="pill">공개 준비 중</span></div></div></article><article class="chapter"><div class="chapter-visual build"><span class="chapter-number">CHAPTER 03</span><span class="chapter-icon" aria-hidden="true">▧</span><strong>BUILD</strong></div><div class="chapter-body"><h3>나만의 프로젝트 완성하기</h3><p>배운 내용을 하나로 모아<br>나만의 프로젝트를 구체화하고 완성합니다.</p><div class="chapter-bottom"><span>마지막 학습 단계</span><span class="pill">공개 준비 중</span></div></div></article></div><aside class="note"><strong>수강 안내 ↗</strong><span>MAKE 챕터에서 1강부터 15강까지 강의 목록을 확인하세요. 강의 영상은 순차적으로 공개될 예정입니다.</span></aside></section>`;
}

function renderMake() {
  app.innerHTML = `<div class="breadcrumb"><a href="#/">강의 소개</a><span>/</span>CHAPTER 01 · MAKE</div><section class="course-hero"><div class="eyebrow">CHAPTER 01 · MAKE</div><h1>AI로 직접 만들기</h1><p class="intro">작은 아이디어를 나만의 결과물로.<br>1강부터 15강까지, AI와 함께 만드는 과정을 차근차근 시작하세요.</p><div class="course-meta"><span>전체 15강</span><span>실습 중심 학습</span><span>영상 순차 공개</span></div><div class="big-word" aria-hidden="true">MAKE</div></section><section aria-labelledby="lessons-title"><div class="toolbar"><h2 id="lessons-title">강의 목록 <span id="lesson-count">15 LESSONS</span></h2><input class="search" type="search" placeholder="강의 검색 · 예: 1강" aria-label="MAKE 강의 검색"></div><div class="lesson-list" id="lesson-list"></div></section>`;
  renderLessons('');
  app.querySelector('input').addEventListener('input', event => renderLessons(event.target.value));
}

function renderLessons(query) {
  const filtered = lessons.filter(lesson => `${lesson.title} ${lesson.number}강`.toLowerCase().includes(query.trim().toLowerCase()));
  document.querySelector('#lesson-count').textContent = `${filtered.length} LESSONS`;
  document.querySelector('#lesson-list').innerHTML = filtered.length ? filtered.map(lesson => `<article class="lesson"><div class="thumbnail" data-number="${String(lesson.number).padStart(2,'0')}" role="img" aria-label="MAKE ${lesson.number}강 썸네일"><small>AI BOOTCAMP / ${String(lesson.number).padStart(2,'0')}</small><strong>MAKE.</strong></div><div class="lesson-copy"><small>LESSON ${String(lesson.number).padStart(2,'0')}</small><h3>${lesson.title}</h3><p>${lesson.description}</p></div><span class="lesson-status">영상 준비 중</span></article>`).join('') : '<p class="empty">검색한 강의가 없습니다. 다른 검색어를 입력해 주세요.</p>';
}

function route() {
  const isMake = location.hash === '#/make' || (!location.hash && /\/make\/(?:index\.html)?$/.test(location.pathname));
  document.title = isMake ? 'MAKE · 1–15강 | AI BOOTCAMP' : 'AI BOOTCAMP · 온라인 강의실';
  for (const [id, active] of [['home-link', !isMake], ['make-link', isMake]]) {
    const link = document.getElementById(id);
    if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  }
  isMake ? renderMake() : renderHome();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
route();
