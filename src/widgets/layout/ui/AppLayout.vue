<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { ArrowRightOnRectangleIcon } from '@heroicons/vue/24/outline'
import logoUrl from '@/app/assets/logo.png'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()
const router = useRouter()

async function handleSignOut() {
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
      <nav class="app-nav">
        <RouterLink to="/">목록</RouterLink>
        <RouterLink to="/review/new">리뷰 작성</RouterLink>
        <RouterLink to="/room/search">방 검색</RouterLink>
        <button class="app-nav__signout" @click="handleSignOut" title="로그아웃">
          <ArrowRightOnRectangleIcon class="app-nav__icon" />
        </button>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

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

.app-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-nav a {
  text-decoration: none;
  color: var(--color-text-sub);
  font-size: 0.875rem;
  font-weight: 500;
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
}

.app-nav a:hover {
  color: var(--color-text);
  background: var(--color-bg);
}

.app-nav a.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
  background: var(--color-primary-bg);
}

.app-nav__signout {
  background: none;
  border: none;
  color: var(--color-text-muted);
  padding: 6px;
  display: flex;
  align-items: center;
  border-radius: var(--radius-sm);
  transition: color var(--transition-fast), background var(--transition-fast);
  margin-left: 4px;
}

.app-nav__signout:hover {
  color: var(--color-error);
  background: var(--color-error-bg);
}

.app-nav__icon {
  width: 20px;
  height: 20px;
}

.app-main {
  flex: 1;
  padding: 20px 16px;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
}

@media (min-width: 640px) {
  .app-header {
    padding: 0 24px;
  }

  .app-main {
    padding: 28px 24px;
  }
}
</style>
