<script setup lang="ts">
// LoginPage — /login
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()
</script>

<template>
  <div class="login">
    <div class="login__card">
      <img src="@/app/assets/logo.png" alt="방탈출 리뷰 로고" class="login__logo" />
      <p class="login__desc">지인들과 방탈출 기록을 공유해보세요</p>
      <button class="login__google-btn" @click="session.signInWithGoogle()">
        <svg class="login__google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google로 로그인
      </button>
    </div>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.login__card {
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 360px;
}

.login__logo {
  height: 48px;
  width: auto;
}

.login__desc {
  font-size: 0.9375rem;
  color: #666;
  text-align: center;
  line-height: 1.5;
}

.login__google-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  width: 100%;
  justify-content: center;
}

.login__google-btn:hover {
  background: #f8f8f8;
}

.login__google-icon {
  width: 20px;
  height: 20px;
}
</style>
