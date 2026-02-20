방탈출 리뷰 앱(escape-log)의 페이지를 구현한다.

구현할 페이지: $ARGUMENTS

절차:
1. `docs/agent_handoff_spec_v_1.md`에서 해당 섹션 확인.
2. `src/pages/`의 현재 페이지 스텁 읽기.
3. 페이지가 의존하는 entity/feature 파악 — 없으면 생성.
4. FSD 레이어링에 맞게 페이지 UI 구현:
   - 페이지는 widgets/features/entities/shared에서만 import.
   - 비즈니스 로직은 features에 배치 (페이지 컴포넌트에 넣지 않음).
   - 도메인 타입/모델은 entities에 배치.
5. `<script setup lang="ts">`, `@/` 별칭, UI 텍스트 한국어 사용.
6. `npx vue-tsc --noEmit` 및 `npm run build`로 검증.

완료 후:
- PR 제목 (한국어) 및 설명 (What/Why/Notes) 제안.
- 미구현 항목 목록 출력.
