const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('make/classroom-review.js', 'utf8').replaceAll('export function', 'function');
const { submissionRows, submissionReview } = new Function(source + '\nreturn {submissionRows, submissionReview};')();
const assignment = { id: 'task-1', title: '내 홈페이지 만들기' };
const item = { id: 'work-1', assignmentId: 'task-1', name: '홍길동', studentId: 'hong', seat: 12, url: 'https://example.com/', description: '만든 작품 설명', images: [], kind: 'website' };

test('teacher list renders one table row per submission with clickable IDs and no real names', () => {
  const html = submissionRows([item, { ...item, id: 'work-2', name: '김수강' }], [assignment]);
  assert.equal((html.match(/<tbody><tr>|<\/tr><tr>/g) || []).length, 2);
  assert.match(html, /data-review="work-1"/);
  assert.match(html, /hong/);
  assert.doesNotMatch(html, /홍길동|김수강|class="work-card"|<img/);
});

test('large review includes task, student, description, safe link and all images', () => {
  const html = submissionReview({ ...item, images: ['one.png', 'two.png'] }, assignment, 0, 2);
  assert.match(html, /내 홈페이지 만들기/);
  assert.match(html, /hong/);
  assert.match(html, /12번 좌석/);
  assert.match(html, /만든 작품 설명/);
  assert.match(html, /href="https:\/\/example.com\/"/);
  assert.equal((html.match(/data-image-path=/g) || []).length, 2);
  assert.match(html, /data-review-step="-1" disabled/);
  assert.match(html, /data-review-step="1" >/);
});

test('unsafe URLs and HTML in submitted content cannot execute in the review', () => {
  const html = submissionReview({ ...item, name: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)', description: '<script>alert(1)</script>' }, assignment, 0, 1);
  assert.doesNotMatch(html, /href="javascript:|<script>|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
});

test('music and no-address results can be opened from the ID even without images', () => {
  assert.match(submissionReview({ ...item, kind: 'music', url: 'https://suno.com/song/example' }, assignment, 0, 1), /Suno에서 열어 재생/);
  assert.match(submissionReview({ ...item, noUrl: true, url: '', description: '' }, assignment, 0, 1), /주소 없이 제출한 과제/);
});
