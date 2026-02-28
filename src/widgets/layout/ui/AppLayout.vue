<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import {
  ArrowRightOnRectangleIcon,
  ListBulletIcon,
  PlusIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'
import logoUrl from '@/app/assets/logo.png'
import { useSessionStore } from '@/app/stores/session'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import AppToast from '@/shared/ui/AppToast.vue'

const session = useSessionStore()
const router = useRouter()

const showLogoutDialog = ref(false)

async function handleSignOut() {
  showLogoutDialog.value = false
  await session.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <RouterLink to="/" class="app-logo-link">
        <img :src="logoUrl" alt="방탈출 리뷰 로고" class="app-logo" />
      </RouterLink>
      <nav class="app-header__nav">
        <RouterLink to="/">목록</RouterLink>
        <RouterLink to="/review/new">리뷰 작성</RouterLink>
        <RouterLink to="/room/search">방 검색</RouterLink>
        <RouterLink to="/profile">프로필</RouterLink>
      </nav>
      <button class="app-header__signout" @click="showLogoutDialog = true" title="로그아웃">
        <ArrowRightOnRectangleIcon class="app-header__signout-icon" />
      </button>
    </header>

    <main class="app-main">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <nav class="app-tab-bar">
      <RouterLink to="/" class="app-tab" exact-active-class="app-tab--active">
        <ListBulletIcon class="app-tab__icon" />
        <span class="app-tab__label">목록</span>
      </RouterLink>
      <RouterLink to="/review/new" class="app-tab app-tab--fab" active-class="app-tab--fab-active">
        <div class="app-tab__fab">
          <PlusIcon class="app-tab__fab-icon" />
        </div>
      </RouterLink>
      <RouterLink to="/profile" class="app-tab" active-class="app-tab--active">
        <UserCircleIcon class="app-tab__icon" />
        <span class="app-tab__label">프로필</span>
      </RouterLink>
    </nav>

    <!-- 로그아웃 확인 -->
    <ConfirmDialog
      :visible="showLogoutDialog"
      title="로그아웃"
      message="정말 로그아웃할까요?"
      confirm-label="로그아웃"
      cancel-label="취소"
      @confirm="handleSignOut"
      @cancel="showLogoutDialog = false"
    />

    <!-- 전역 토스트 -->
    <AppToast />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ── 헤더 ── */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 52px;
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: 50;
}

.app-logo-link {
  display: flex;
  align-items: center;
}

.app-logo {
  height: 28px;
  width: auto;
}

.app-header__signout {
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 6px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
  cursor: pointer;
}

.app-header__signout:hover {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.app-header__signout-icon {
  width: 20px;
  height: 20px;
}

/* ── 헤더 데스크톱 nav (모바일에서는 숨김) ── */
.app-header__nav {
  display: none;
}

/* ── 메인 ── */
.app-main {
  flex: 1;
  padding: 20px 16px;
  /* 하단 탭바 높이(56px) + safe-area 만큼 여백 확보 */
  padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 20px);
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
}

/* ── 하단 탭바 ── */
.app-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(56px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  display: flex;
  align-items: stretch;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  z-index: 50;
}

.app-tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-decoration: none;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
}

.app-tab:hover {
  color: var(--color-text-sub);
}

.app-tab--active {
  color: var(--color-primary);
}

.app-tab__icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

.app-tab__label {
  font-size: 0.6875rem;
  font-weight: 500;
  white-space: nowrap;
}

/* FAB (중앙 + 버튼) */
.app-tab--fab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.app-tab__fab {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: background var(--transition-fast), transform var(--transition-fast);
}

.app-tab--fab:hover .app-tab__fab,
.app-tab--fab-active .app-tab__fab {
  background: var(--color-primary-dark);
}

.app-tab--fab:active .app-tab__fab {
  transform: scale(0.93);
}

.app-tab__fab-icon {
  width: 24px;
  height: 24px;
  color: #fff;
  stroke-width: 2.5;
}

/* ── 페이지 트랜지션 ── */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* 데스크톱: 탭바 숨기고 헤더 nav 표시 */
@media (min-width: 640px) {
  .app-header {
    padding: 0 24px;
  }

  .app-header__nav {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .app-header__nav a {
    text-decoration: none;
    color: var(--color-text-sub);
    font-size: 0.875rem;
    font-weight: 500;
    padding: 6px 10px;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    transition: color var(--transition-fast), background var(--transition-fast);
  }

  .app-header__nav a:hover {
    color: var(--color-text);
    background: var(--color-bg);
  }

  .app-header__nav a.router-link-active {
    color: var(--color-primary);
    font-weight: 600;
    background: var(--color-primary-bg);
  }

  .app-main {
    padding: 28px 24px;
  }

  .app-tab-bar {
    display: none;
  }
}
</style>
