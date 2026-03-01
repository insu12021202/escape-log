<p align="center">
  <img src="src/app/assets/logo.png" alt="Escape Log" width="280" />
</p>

<p align="center">
  <b>방탈출 경험을 기록하고, 되돌아보고, 함께 나누는 공간</b>
</p>

<p align="center">
  <a href="https://escape-log-chi.vercel.app">escape-log-chi.vercel.app</a>
</p>

---

## 소개

**Escape Log**는 방탈출 카페를 즐기는 사람들을 위한 개인 리뷰 기록 앱입니다.

플레이한 테마의 별점과 세부 평가를 남기고, 사진과 함께 기록을 쌓아가세요. 링크 하나로 친구에게 내 후기를 공유할 수도 있습니다.

> _"그 테마 별점 몇이었지?" — 더 이상 기억에 의존하지 마세요._

---

## 주요 기능

### 리뷰 작성

4단계 위저드 폼으로 방탈출 경험을 빠짐없이 기록합니다.

- **별점 평가** — 전체 평점(1~5)과 6가지 세부 지표(퍼즐 퀄리티, 스토리 연출, 세트 퀄리티, 공포도, 퍼즐 난이도, 클리어 난이도)
- **방문 기록** — 성공/실패, 잔여 시간, 인원수, 방문일
- **장르 태그** — 12가지 기본 태그 + 커스텀 태그
- **사진 첨부** — 최대 3장, 라이트박스 뷰어 지원
- **스포일러 분리** — 스포일러 내용은 별도 표시

### 리뷰 목록 & 필터

한눈에 내 기록을 훑어보고, 원하는 조건으로 찾아보세요.

- **내 기록 / 전체** 탭 전환
- **지역**, **평점**, **키워드** 필터링
- **평점순 정렬** (높은순 / 낮은순)
- 전체 플레이 수 & 탈출 성공률 통계

### 방 & 업체 관리

테마 정보를 직접 등록하고 관리할 수 있습니다.

- 업체명으로 검색 → 테마 등록
- 포스터 이미지 업로드 (클립보드 붙여넣기 지원)
- 등록된 방 정보는 리뷰 작성 시 연동

### 공유

링크 하나로 내 리뷰를 공유합니다.

- 리뷰 공개 범위 설정: **그룹 공개** / **비공개** / **링크 공유**
- 카카오톡 공유 버튼 (미지원 환경에서는 클립보드 복사)

### 인증

- Google OAuth 로그인
- 이메일/비밀번호 회원가입 & 로그인

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | Vue 3 + Vite + TypeScript |
| Architecture | Feature-Sliced Design (FSD) |
| State | Pinia |
| Routing | Vue Router 4 (lazy-loaded) |
| Backend | Supabase (PostgreSQL + RLS + RPC + Auth + Storage) |
| Deploy | Vercel |

---

## 프로젝트 구조

```
src/
  app/        → 진입점, 라우터, Pinia, 전역 스타일
  pages/      → 라우트 단위 페이지 컴포넌트
  widgets/    → 복합 UI 블록 (AppLayout 등)
  features/   → 사용자 인터랙션 단위 (폼, 카드 등)
  entities/   → 도메인 모델 (review, room, vendor)
  shared/     → 공용 UI, 유틸, 설정
```

의존 방향: `shared → entities → features → widgets → pages → app`

---

## 시작하기

### 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 아래 값을 채워넣습니다.

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

---

## 배포

### Vercel

1. Vercel 대시보드에서 GitHub 레포 연결
2. 환경 변수 설정 (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_DEFAULT_GROUP_ID`
3. Supabase Authentication → URL Configuration에 배포 URL 추가:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

> `vercel.json`에 SPA 라우팅 rewrite 설정이 포함되어 있습니다.

### Supabase 사전 설정

| 항목 | 내용 |
|------|------|
| Storage 버킷 | `review-photos` (Public) |
| Storage 정책 | `authenticated` 사용자 INSERT 허용 |
| Auth Provider | Google OAuth + 이메일 로그인 활성화 |
| Email 설정 | Confirm email OFF 권장 (즉시 로그인) |

---

## 라우트

| 경로 | 설명 |
|------|------|
| `/` | 리뷰 목록 |
| `/review/new` | 리뷰 작성 |
| `/review/:id` | 리뷰 상세 |
| `/review/:id/edit` | 리뷰 수정 (작성자만) |
| `/room/search` | 방 검색 / 등록 |
| `/share/:token` | 링크 공유 열람 |
| `/login` | 로그인 |
| `/profile` | 프로필 |

---

## 개발 문서

- [기능 스펙 (SSOT)](docs/agent_handoff_spec_v_1.md)
- [개발 로드맵 및 현재 상태](docs/roadmap.md)
