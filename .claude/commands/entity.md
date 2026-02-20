방탈출 리뷰 앱(escape-log)의 엔티티를 생성/수정한다.

대상 엔티티: $ARGUMENTS

절차:
1. `docs/agent_handoff_spec_v_1.md` §3(REVIEW_FORM_SPEC), §4(DATA_MODEL) 확인.
2. `src/entities/<name>/types/`에 TypeScript 타입 정의.
3. 목 데이터나 상수가 필요하면 `src/entities/<name>/lib/`에 배치.
4. API 호출이 필요하면 `src/entities/<name>/api/`에 정의 (Supabase 연결 전까지 인터페이스만).
5. 엔티티는 features, widgets, pages에서 import 금지.
6. `npx vue-tsc --noEmit`으로 타입 검증.
