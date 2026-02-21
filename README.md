# Escape Log

방탈출 경험을 기록하고 지인과 공유하는 개인 기록 앱.

## 주요 기능

- 방탈출 리뷰 작성 / 수정 (별점, 한줄평, 보조 지표 6개, 방문 메타)
- 리뷰 목록 조회 및 필터링 (지역, 평점)
- 링크 공유 (`/share/:token`) — 로그인 사용자 열람 가능
- Google OAuth 로그인 (Supabase Auth)

## 기술 스택

| 영역 | 기술 |
|------|------|
| FE | Vue 3 + Vite + TypeScript |
| 아키텍처 | Feature-Sliced Design (FSD) |
| 상태 관리 | Pinia |
| 라우터 | Vue Router 4 |
| 백엔드 | Supabase (Postgres + RLS + RPC + Auth) |

## 시작하기

### 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 아래 값을 채워넣는다.

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DEFAULT_GROUP_ID=your-default-group-uuid
```

### 개발 서버 실행

```bash
npm install
npm run dev
```

### 빌드 / 타입 체크

```bash
npm run build        # 타입 체크 + 프로덕션 빌드
npm run typecheck    # 타입 체크만
npm run lint         # ESLint
```

## 프로젝트 구조

```
src/
  app/        → 진입점, 라우터, Pinia, 전역 스타일
  pages/      → 라우트 단위 페이지 컴포넌트
  features/   → 사용자 인터랙션 단위 (폼, 목록 등)
  entities/   → 도메인 모델 (review, room)
  shared/     → 공용 UI, 유틸, 설정
```

의존 방향: `shared → entities → features → pages → app`

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 리뷰 목록 |
| `/review/new` | 리뷰 작성 |
| `/review/:id` | 리뷰 상세 |
| `/review/:id/edit` | 리뷰 수정 (작성자만) |
| `/room/search` | 방 검색 / 등록 |
| `/share/:token` | 링크 공유 열람 |
| `/login` | Google OAuth 로그인 |

## 개발 문서

- [기능 스펙 (SSOT)](docs/agent_handoff_spec_v_1.md)
- [개발 로드맵 및 현재 상태](docs/roadmap.md)
