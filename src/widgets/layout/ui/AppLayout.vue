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
  padding: 12px 24px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.app-logo-link {
  display: flex;
  align-items: center;
}

.app-logo {
  height: 32px;
  width: auto;
}

.app-nav {
  display: flex;
  gap: 16px;
}

.app-nav a {
  text-decoration: none;
  color: #213547;
  font-size: 0.875rem;
}

.app-nav a.router-link-active {
  font-weight: 600;
}

.app-nav__signout {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.app-nav__signout:hover {
  color: #e53935;
}

.app-nav__icon {
  width: 20px;
  height: 20px;
}

.app-main {
  flex: 1;
  padding: 24px;
}
</style>
