방탈출 리뷰 앱(escape-log)의 버그를 디버깅한다.

문제 상황: $ARGUMENTS

접근 방법:
1. 문제 재현 — 관련 소스 파일 읽기.
2. FSD 레이어를 따라 데이터 흐름 추적 (page → widget → feature → entity → shared).
3. 자주 발생하는 문제 점검:
   - 잘못된 import 경로 또는 별칭 설정 오류.
   - FSD 레이어 위반 (상위 의존).
   - 반응형 상태 누락 (ref/computed 미사용).
   - 라우터 파라미터 타입 불일치.
4. 최소한의 수정을 제안. 관련 없는 코드는 리팩터링하지 않음.
5. `npx vue-tsc --noEmit` 및 `npm run build`로 수정 검증.
