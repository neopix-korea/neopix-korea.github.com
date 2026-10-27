const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function linkFor(item) {
  try {
    const url = new URL(item.url);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
function timeFor(item) {
  const time = item.createdAt?.toMillis?.();
  return time ? new Date(time).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '서버 확인 중';
}
export function submissionRows(items, assignments) {
  if (!items.length) return '<p class="work-empty">아직 제출된 작품이 없습니다.</p>';
  return `<div class="work-submission-table-wrap"><table class="work-submission-table"><caption>이름을 클릭하면 제출한 과제를 크게 볼 수 있습니다.</caption><thead><tr><th scope="col">좌석</th><th scope="col">이름 · 클릭하여 보기</th><th scope="col">아이디</th><th scope="col">과제</th><th scope="col">제출 시각</th><th scope="col">제출 내용</th></tr></thead><tbody>${items.map(item => {
    const assignment = assignments.find(task => task.id === item.assignmentId);
    const contents = [item.noUrl ? '주소 없음' : (linkFor(item) ? '결과물 링크' : ''), item.images?.length ? `이미지 ${item.images.length}장` : '', item.description ? '작품 설명' : ''].filter(Boolean).join(' · ') || '제출 완료';
    return `<tr><td>${esc(item.seat)}번</td><td><button type="button" class="work-student-name" data-review="${esc(item.id)}" aria-label="${esc(item.name)} 제출 과제 크게 보기">${esc(item.name)} <span aria-hidden="true">↗</span></button></td><td>${esc(item.studentId)}</td><td class="work-row-task" title="${esc(assignment?.title || '과제')}">${esc(assignment?.title || '과제')}</td><td><time>${esc(timeFor(item))}</time></td><td>${esc(contents)}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

export function submissionReview(item, assignment, index, count) {
  const url = linkFor(item);
  return `<header class="work-review-toolbar"><div class="work-review-paging"><button type="button" class="work-button secondary" data-review-step="-1" ${index <= 0 ? 'disabled' : ''}>← 이전</button><span>${index + 1} / ${count}</span><button type="button" class="work-button secondary" data-review-step="1" ${index >= count - 1 ? 'disabled' : ''}>다음 →</button></div><button type="button" class="work-button secondary" data-close autofocus>목록으로 · 닫기 ×</button></header><article class="work-review-content"><p class="work-review-assignment">${esc(assignment?.title || '제출한 과제')}</p><h2 id="work-review-title">${esc(item.name)} <span>${esc(item.seat)}번 좌석 · ${esc(item.studentId)}</span></h2><p class="work-review-time">${esc(timeFor(item))} 제출</p>${item.description ? `<section class="work-review-description" aria-label="작품 설명">${esc(item.description)}</section>` : ''}${url ? `<div class="work-review-link"><a class="work-button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${item.kind === 'music' ? 'Suno에서 열어 재생 ↗' : '결과물 홈페이지 열기 ↗'}</a><p>${esc(url)}</p></div>` : (item.noUrl ? '<p class="work-review-no-url">주소 없이 제출한 과제입니다.</p>' : '')}${item.images?.length ? `<section class="work-review-images" data-count="${item.images.length}" aria-label="제출 이미지">${item.images.map((path, index) => `<div data-image-path="${esc(path)}" aria-label="제출 이미지 ${index + 1}">이미지 불러오는 중…</div>`).join('')}</section>` : ''}${!url && !item.images?.length && !item.description && !item.noUrl ? '<p class="work-empty">첨부된 결과물 주소나 이미지가 없습니다.</p>' : ''}</article>`;
}
