방탈출 리뷰 앱(escape-log)의 기능을 구현한다.

구현할 기능: $ARGUMENTS

코딩 전:
1. `docs/agent_handoff_spec_v_1.md`를 읽고 해당 기능이 범위 내인지 확인.
2. 영향받는 FSD 레이어와 슬라이스를 식별.
3. 의존 방향이 올바른지 확인 (shared → entities → features → widgets → pages → app).
4. 작업 브랜치명을 제안 (예: `feature/review-create-form`).
5. 3~5개 항목으로 구현 계획을 요약.

코딩 중:
- 모든 Vue 컴포넌트에 `<script setup lang="ts">` 사용.
- import에 `@/` 별칭 사용.
- 올바른 FSD 세그먼트에 코드 배치 (ui/, model/, api/, lib/, types/).
- 같은 레이어 내 슬라이스 간 import 금지.
- UI 텍스트는 한국어, 코드는 영어.

코딩 후:
- `npx vue-tsc --noEmit`으로 타입 검사.
- `npm run build`로 빌드 확인.
- 생성/수정된 파일 목록 출력.
- PR 제목 (한국어) 및 설명 (What/Why/Notes) 제안.
- 아직 미구현된 항목 목록 출력.
