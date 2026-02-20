방탈출 리뷰 앱(escape-log) 프로젝트의 커밋을 생성한다.

커밋 대상: $ARGUMENTS

절차:
1. `git status`와 `git diff`로 현재 변경사항 파악.
2. 논리적 단위로 변경사항 분류. 관련 없는 변경이 있으면 별도 커밋으로 분리.
3. 프로젝트 커밋 컨벤션에 따라 메시지 작성:
   - 형식: `<type>(<scope>): <한국어 설명>`
   - type: feat, fix, refactor, style, docs, chore, test
   - scope: FSD 레이어 또는 슬라이스명 (예: review-create, entities, router, shared)
   - subject: 한국어, 50자 이내, 마침표 없음
4. 기능 구현 커밋이면 body에 `Spec: §<섹션>` 추가.
5. 관련 파일만 선택적으로 스테이징 — `git add -A` 사용 금지.
6. HEREDOC으로 커밋 메시지 전달.
7. 커밋 후 `git status`로 성공 확인.
