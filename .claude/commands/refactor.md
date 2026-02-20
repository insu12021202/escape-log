방탈출 리뷰 앱(escape-log)의 코드를 리팩터링한다.

리팩터링 대상: $ARGUMENTS

규칙:
1. 변경 전 영향받는 모든 파일을 먼저 읽을 것.
2. 리팩터링 후에도 FSD 의존 규칙이 유지되는지 확인.
3. 동작을 변경하지 않음 — 리팩터링은 구조 개선만.
4. 레이어 간 코드 이동 시 방향 확인: shared → entities → features → widgets → pages → app.
5. 이동으로 영향받는 모든 import 경로 업데이트.
6. 변경 후 `npx vue-tsc --noEmit` 및 `npm run build` 실행.
7. 이동된 파일의 변경 전/후 위치 목록 출력.

완료 후:
- PR 제목 (한국어) 및 설명 (What/Why/Notes) 제안.
