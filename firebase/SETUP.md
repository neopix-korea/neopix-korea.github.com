# MAKE 강의실 Firebase 연결

기존 GitHub Pages에서 화면을 제공하고 Firebase Authentication, Cloud Firestore, Storage에서 입장 정보·과제·제출물·이미지를 공유합니다.

1. Firebase 프로젝트에 웹 앱을 등록하고 공개 firebaseConfig를 `make/classroom-config.js`의 `firebase`에 입력합니다. Admin SDK 비밀키는 사용하지 않습니다.
2. 기존 `yeonsung-ac` 프로젝트의 익명 로그인(학생 기기용)과 Google 로그인(교수용)을 사용합니다. 학생에게 비밀번호 입력은 없습니다.
3. **운영 프로젝트의 기존 규칙 전체를 이 파일로 덮어쓰면 안 됩니다.** `firebase/firestore.rules`는 부트캠프 전용 규칙을 담은 참고 파일입니다. 기존 규칙을 먼저 백업하고, 바깥쪽 `match /databases/{database}/documents` 안에 전용 함수 및 `bootcampClassrooms` 경로를 병합한 후 게시합니다.
4. Storage도 기존 규칙을 백업한 후 `firebase/storage.rules`의 전용 함수·경로를 바깥쪽 버킷 match 안에 병합합니다. 기존 경로 규칙을 보존합니다. 추가 IAM 교차 서비스 연결은 사용하지 않습니다.
5. 교수는 기존 서비스와 같은 `dasahee@yeonsung.ac.kr` Google 계정을 사용합니다. 서버 규칙이 검증된 이메일을 검사하며 별도의 비밀번호나 교사 권한 문서를 만들지 않습니다. Google 로그인을 사용할 사이트 도메인은 Authentication의 승인된 도메인에 등록되어 있어야 합니다.
6. 화면에서 교수 로그인 → 과제 공개 → 별도 스마트폰/PC로 학생 등록·제출 → 교수 화면 수신을 확인합니다. 이미지 첨부도 실제 Storage 업로드까지 확인합니다.

## 입장·좌석 동작

- 학생이 선택한 아이디는 `/bootcampClassrooms/make-2026/students/{아이디}`에 한 번 등록합니다. 중복 등록은 트랜잭션으로 차단합니다.
- 브라우저별 익명 인증 UID의 `devices/{UID}` 문서에 선택한 아이디와 현재 좌석을 기억합니다. 다음 방문에는 자동 입장합니다. 브라우저 저장소 삭제·시크릿 창·다른 브라우저에서는 다시 선택해야 합니다.
- 스마트폰이나 새 PC에서는 새 아이디를 만들지 않고 기존 아이디를 선택합니다. 좌석 이동 시 입장 정보 변경으로 현재 좌석을 바꿉니다. 다른 기기의 좌석 설정까지 덮어쓰지 않습니다.
- 제출물은 학생 아이디와 연결되고 제출 당시 좌석번호를 별도로 저장합니다. 좌석 이동 후에도 이전 제출 기록은 유지됩니다.
- 아이디 선택 방식은 수업용 본인 표시 방식이며 강한 학생 본인 인증이 아닙니다. 다른 학생 아이디 선택을 기술적으로 금지하는 방식은 아닙니다. 교수 권한은 Firebase 인증과 서버 규칙으로 별도 보호합니다.
- 학생은 선택한 본인의 제출 내역을 보고, 교수는 전체 제출물을 실시간으로 봅니다. 스크린 화면도 교수 로그인 상태가 필요합니다.
- 음악은 Suno 링크를 새 창으로 열어 교수 PC에서 직접 재생합니다. 자동 재생·외부 홈페이지 iframe 삽입을 사용하지 않습니다.
- Firebase 연결 실패나 권한 오류 시 성공으로 표시하지 않습니다. Firestore 서버 저장 응답 후 제출 완료를 표시합니다. 이미지 업로드 후 제출 문서 저장이 실패하면 이번 업로드를 정리합니다.
- 제출 문서에는 Firebase의 이미지 다운로드 URL을 저장합니다. URL을 알면 이미지를 볼 수 있으므로 이 링크는 일반 게시판에 공개하지 않습니다. 제출 내역을 읽는 권한은 본인 선택 상태와 교수 권한으로 제한됩니다. 학생이 자신의 업로드 이미지를 삭제하면 해당 이미지 링크는 더 이상 유효하지 않을 수 있습니다.

## 배포

사이트 파일은 기존 GitHub Pages 배포를 사용합니다. Firebase Hosting 배포는 필요 없습니다.
운영 Firebase는 기존 결제 연결이 있는 `yeonsung-ac`를 사용합니다. 이번 작업에서 만든 `neopix-ai-bootcamp`는 사용하지 않으며 무료 Spark 상태로 남아 있습니다. 임의 삭제나 결제 연결은 하지 않습니다.
기존 규칙과 병합 파일의 로컬 백업은 `backups/firebase-20261027/`에 있습니다(Git 제외). 이 저장소에는 다른 서비스 전체 규칙을 담은 배포 설정을 두지 않습니다.

공식 참고: [웹 앱 설정](https://firebase.google.com/docs/web/setup), [Firestore 실시간 업데이트](https://firebase.google.com/docs/firestore/query-data/listen), [이미지 업로드](https://firebase.google.com/docs/storage/web/upload-files).
