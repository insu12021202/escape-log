# Escape-Log — Project Rules

## What is this?
방탈출 리뷰 앱 (v1 MVP). SSOT: `docs/agent_handoff_spec_v_1.md`

## Tech Stack
- Vue 3 + Vite + TypeScript
- Vue Router 4 (lazy-loaded routes)
- Pinia 2 (state management)
- Supabase (backend — not yet connected)

## Architecture: Feature-Sliced Design (FSD)
```
src/
  app/        → entry point, router, pinia, global styles
  pages/      → route-level components (one slice per route)
  widgets/    → composite UI blocks (e.g. AppLayout)
  features/   → user-facing interactions (e.g. review-create form)
  entities/   → domain models (e.g. review, room)
  shared/     → reusable UI, utils, types, config
```

### Dependency Rule (strict)
shared → entities → features → widgets → pages → app

- NEVER import upward (e.g. entities must not import from features).
- Each slice has colocated segments: `ui/`, `model/`, `api/`, `lib/`, `types/`.
- Cross-slice imports within the same layer are forbidden.

## Routing
| Path            | Page Component       |
|-----------------|----------------------|
| `/`             | ReviewListPage       |
| `/review/new`   | ReviewCreatePage     |
| `/review/:id`   | ReviewDetailPage     |
| `/room/search`  | RoomSearchPage       |
| `/share/:token` | SharedReviewPage     |

## Language Rules (HARD REQUIREMENT)
- 사용자와의 대화: **항상 한국어**
- GitHub Issue: **한국어**
- PR 제목/설명: **한국어**
- 커밋 메시지: prefix는 영어 (`feat`, `fix` 등), 본문은 **한국어**
- 코드, 파일명, 폴더명, 식별자: **영어**
- 영어로 Issue/PR을 쓰려 했다면, 멈추고 한국어로 다시 작성할 것.

## Conventions
- Use `@/` path alias for imports from `src/`.
- Components: PascalCase, `<script setup lang="ts">` only.
- One component per file. Name must match filename.
- No UI libraries — build components from scratch.
- No business logic without spec reference.

## Branch Strategy
- `main`: 항상 안정 상태 유지. 직접 커밋 금지.
- `feature/*`: 모든 개발은 여기서 진행.
- 작업 시작 전 브랜치명을 먼저 제안할 것 (예: `feature/review-list-ui`).

## PR Discipline
작업 완료 후 반드시 PR을 제안할 것. 형식:

```
제목: feat: 리뷰 목록 화면 구현

## What
- 무엇을 구현/변경했는지

## Why
- 왜 이 변경이 필요한지 (SSOT 기준)

## Notes
- 제약사항, 제외 범위, 후속 작업
```

- PR은 결정 기록이자 체크포인트로 취급.
- 관련 없는 변경을 하나의 브랜치/PR에 섞지 않을 것.
- 작업이 크면 여러 feature 브랜치와 PR로 분리.

## Task Execution Protocol
코딩 **전**에 반드시 명시:
1. 작업 브랜치명
2. PR이 나타내는 작업 단위

코딩 **후**에 반드시 출력:
1. PR 제목 (한국어)
2. PR 설명 (한국어, What/Why/Notes)
3. 아직 미구현 항목 목록

## Guardrails
- 현재 태스크 범위 밖은 구현하지 않는다.
- SSOT에 없는 기능을 몰래 추가하지 않는다.
- 모호한 부분은 합리적으로 가정하되, PR Notes에 명시한다.

## Commit Convention
Format: `<type>(<scope>): <한국어 설명>`

### Types
| Type       | 용도                                  |
|------------|---------------------------------------|
| `feat`     | 새 기능                               |
| `fix`      | 버그 수정                             |
| `refactor` | 동작 변경 없는 코드 구조 개선          |
| `style`    | 포맷팅, 공백 등 로직 무관 변경         |
| `docs`     | 문서만 변경                            |
| `chore`    | 빌드 설정, 의존성, 도구 관련           |
| `test`     | 테스트 추가/수정                       |

### Scope
FSD 레이어 또는 슬라이스명 사용: `app`, `router`, `review-list`, `review-create`, `review-detail`, `room-search`, `shared-review`, `layout`, `shared`, `entities`, `features`.

### Rules
- Subject: 한국어, 50자 이내, 마침표 없음.
- Body (선택): 72자 줄바꿈. **왜** 변경했는지 설명.
- 커밋 하나에 논리적 변경 하나. 관련 없는 변경 혼합 금지.
- 기능 구현 시 스펙 참조: `Spec: §3.1`

### Examples
```
feat(review-create): 별점 입력 컴포넌트 추가
fix(router): 공유 리뷰 페이지 lazy-load 경로 수정
refactor(entities): 리뷰 타입을 전용 슬라이스로 분리
chore(app): vite/tsconfig 경로 별칭 설정
docs(spec): 태그 시스템 결정 로그 업데이트
```

## Commands
- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npx vue-tsc --noEmit` — type-check only
