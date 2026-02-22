# Escape Log v1 — Development Roadmap (Claude Code Prompt)

이 문서는 Claude Code가 Escape Log 프로젝트의 **현재 단계(Phase)** 를 스스로 판별하고,
**다음 작업을 브랜치/PR 단위로 기획**하기 위한 기준 문서다.

---

## 프로젝트 개요

- 프로젝트명: escape-log
- 목적: 지인용 방탈출 리뷰 기록 앱 (개인 기록 + 링크 공유)
- 플랫폼: Web → Capacitor (iOS/Android)
- 개발 형태: FE 중심, BE는 Supabase 설정형 구현

---

## 공통 규칙

### 언어 규칙
- 대화 / Issue / PR: 한국어
- 코드 / 파일명 / 식별자: 영어

### Git / 협업 규칙 (1인 개발이지만 엄격)
- main: 항상 안정 (릴리즈 가능 상태)
- feature/*: 모든 작업
- PR 필수
- PR 템플릿: What / Why / Notes
- 1 PR = 1 목적 (작게, 명확하게)

### 기술 스택
- FE: Vue 3 + Vite + TypeScript
- 아키텍처: Feature-Sliced Design (FSD)
  - app / pages / widgets / features / entities / shared
- Router: Vue Router
- State: Pinia
- BE: Supabase (Postgres + RLS + RPC + Storage)
- 배포: Vercel
- CI: GitHub Actions
- 패키지 매니저: npm

---

## Phase 전체 개요

Claude Code는 **아래 Phase 중 현재 프로젝트가 어디에 속하는지 판단**해야 하며,
항상 **다음 Phase를 향한 최소 단위 PR**을 목표로 한다.

| Phase | 이름 | 핵심 목표 | Supabase |
|---|---|---|---|
| P0 | CI 기반 안정화 | main 브랜치 품질 보장 | ❌ |
| P1 | FE 스캐폴딩 | 앱 뼈대 + 라우트 구성 | ❌ |
| P2 | FE 도메인 구체화 | 리뷰/방/공유 흐름 고정 | ❌ |
| P3 | Supabase 연동 | 실제 데이터 연결 | ✅ |
| P4 | 인증/권한 | 로그인 + RLS 검증 | ✅ |
| P5 | UX 완성 | 예외/빈상태/에러 처리 | ✅ |
| P6 | v1 마감 | 배포 안정화 | ✅ |

---

## Phase 상세 정의

### Phase 0 — CI 기반 안정화
**목표**
- main 브랜치가 항상 빌드/린트/타입체크 통과

**완료 조건**
- GitHub Actions CI 구성 완료
- PR / main push 시:
  - npm ci
  - npm run lint
  - npm run typecheck
  - npm run build
- CI 초록 상태로 main merge 완료

**다음 Phase**
- Phase 1 (FE 스캐폴딩)

---

### Phase 1 — FE 스캐폴딩
**목표**
- 앱의 구조와 진입점을 눈에 보이게 만든다

**포함**
- Vue 3 + Vite + TS 초기화
- FSD 폴더 구조 생성
- Router 설정
- 빈 페이지 라우트 5개

**라우트**
- /
- /review/new
- /review/:id
- /room/search
- /share/:token

**완료 조건**
- 모든 라우트가 정상적으로 이동됨
- 각 페이지는 최소한의 placeholder UI만 존재

**금지**
- Supabase 연결
- 인증 로직
- 실제 데이터 통신

**다음 Phase**
- Phase 2 (FE 도메인 구체화)

---

### Phase 2 — FE 도메인 구체화
**목표**
- UI 기준으로 도메인 경계를 확정한다
- Supabase 없이도 앱 흐름을 설명할 수 있어야 한다

**포함**
- entities 구조 분리 및 타입 정의
  - review: 리뷰 타입, 보조 지표 6개, 방문 메타
  - room: 방 타입 (vendor_name, theme_name, region)
  - share: 공유 토큰 타입, visibility enum
- 고정 태그 12개 상수 정의 (entities/review/lib)
  - 공포, 감성, 추리, 스릴러, 코믹, 액션, 잠입/미션, 판타지, 어드벤처, 미스터리, 드라마, SF
- features 구조 분리
  - review-create: 리뷰 작성 폼 (별점 + 한줄평 + 보조 지표 + 방문 메타 + 본문)
  - review-list: 리뷰 목록 + 필터 (지역, 평점)
  - room-search: 방 검색/등록 UI
  - share: visibility 전환 UI (group/private/link)
- mock 데이터 기반 화면 흐름 완성
  - 리뷰 작성 → 목록 → 상세 → 공유 전체 흐름
- API 형태가 자연스럽게 드러나야 함

**완료 조건**
- Supabase 없이도 앱 흐름을 완전히 시연 가능
- 필요한 API 목록이 명확해짐
- 고정 태그가 상수로 정의되어 있음

**다음 Phase**
- Phase 3 (Supabase 연동)

---

### Phase 3 — Supabase 연동
**목표**
- 기존 FE 흐름에 실제 데이터 연결

**포함**
- supabase client 설정
- DDL 적용 (reviews, rooms 테이블 + unique 제약)
- 태그 시드 데이터 입력 (고정 12개)
- table / RPC 호출 구현
  - 리뷰 CRUD
  - 방 검색/등록
  - get_shared_review(token) RPC
  - share_token 발급 (visibility=link 전환 시)
- 사진 업로드 (Supabase Storage)
  - 리뷰당 1~3장
  - 업로드 실패 재시도 UX (SSOT 체크리스트)
- entities 단위 API 파일 작성

**완료 조건**
- mock 제거
- 실제 리뷰 조회/작성/공유 가능
- 사진 업로드 동작

**다음 Phase**
- Phase 4 (인증/권한)

---

### Phase 4 — 인증 / 권한
**목표**
- 로그인 기반 접근 제어 완성

**포함**
- Supabase Auth 연동
- 로그인 필수 흐름 적용
- RLS 정책 실제 검증
  - 작성자: CRUD 가능
  - 그룹 멤버: visibility=group 조회 가능
  - private: 작성자만
  - link: 로그인 사용자만 / RPC로 조회
- 링크 공유는 RPC로만 조회

**완료 조건**
- 비로그인 접근 차단
- 권한에 따른 데이터 접근 보장

**다음 Phase**
- Phase 5 (UX 완성)

---

### Phase 5 — UX 완성
**목표**
- 사용 가능한 앱 상태로 정리

**포함**
- 로딩 / 에러 / 빈 상태 UI
- 폼 유효성 검증 (SSOT §3 기준)
  - 별점 1~5 필수
  - 한줄평 ≤100자
  - 본문 ≤3000자
  - 사진 1~3장 강유도
  - 성공/실패 필수, 인원 수 필수
- 기본 UX 다듬기

**다음 Phase**
- Phase 6 (v1 마감)

---

### Phase 6 — v1 마감
**목표**
- 배포 안정화 및 v1 종료

**포함**
- 환경 변수 점검
- Vercel 배포 확인
- README 정리

---

## Claude Code 작업 원칙

1. 항상 현재 Phase를 먼저 판단한다
2. 다음 Phase로 가기 위한 **최소 단위 PR**만 제안한다
3. 작업 전:
   - 브랜치 이름 제안
   - 작업 범위 요약
4. 작업 후:
   - PR 제목/본문(What / Why / Notes) 자동 작성
5. Supabase는 **Phase 3 이전에 절대 연결하지 않는다**

---

## 결정 완료 사항

- **"그룹"의 정의 (결정됨)**: v1에서 그룹 = **로그인한 전체 사용자(단일 전역 그룹)**.
  초대 기반 그룹이 아님. UI 라벨은 **'회원 공개'**, DB 값은 `visibility='group'` 유지.
  → SSOT DECISIONS §7에 반영 완료.

---

## 현재 상태 기록 (수동 업데이트)

- 현재 Phase: **Phase 6 진행 중** (v1 마감)
- 마지막 완료 PR: feat: 사진 업로드 기능 추가 (#14)

### 완료된 작업 요약

#### Phase 3 (Supabase 연동) — 사진 업로드 제외 완료
- Supabase client 설정, DDL 적용 (reviews, rooms, tags, review_tags, profiles)
- 태그 시드 데이터 12개 입력
- 리뷰 CRUD API (`fetchReviews`, `fetchReviewById`, `createReview`, `updateReview`)
- 방 검색/등록 API (`searchRooms`, `upsertRoom`)
- `get_shared_review(token)` RPC 연동, share_token 발급 (visibility=link 전환 시)
- mock 데이터 → Supabase 연동으로 교체
- 별점 0.5 단위 입력, 드래그/터치 지원 추가

#### Phase 4 (인증/권한) — 완료
- Google OAuth 로그인 (Supabase Auth)
- 비로그인 접근 차단 (router guard)
- profiles 테이블 + FK 설정 (작성자 이름 PostgREST JOIN)
- 리뷰 상세에서 본인 리뷰에만 수정 버튼 노출 (`review.userId === currentUserId`)
- 리뷰 수정 페이지 (`/review/:id/edit`) + ReviewCreateForm 공용 재사용

#### Phase 5 (UX 완성) — 완료
- 리뷰 작성 폼 유효성 검증 (SSOT §3 기준) — PR #12
  - 총평 별점 1점 이상 필수, 한줄평 필수/100자, 성공/실패 명시적 선택 필수, 인원 수 필수
  - 필드별 에러 메시지 인라인 표시
- 로딩 스피너 및 에러 상태 UI 정리 — PR #13
  - AppSpinner.vue 공유 컴포넌트 생성, 전 페이지 적용
  - RoomSearchPage 검색 실패 에러 메시지 추가

#### Phase 3 이월 — 사진 업로드 완료
- Supabase Storage `review-photos` 버킷 연동 — PR #14
  - PhotoUploader.vue: 최대 3장, 5MB 제한, 즉시 미리보기
  - 리뷰 저장 후 사진 업로드, 실패 시 재시도/건너뛰기 UI
  - 리뷰 상세에서 사진 그리드 표시 + 라이트박스(이전/다음 탐색)

### 미완료 항목
- [ ] v1 마감 (환경 변수 점검, Vercel 배포, README) — Phase 6
