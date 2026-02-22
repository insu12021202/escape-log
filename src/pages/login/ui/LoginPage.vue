<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/app/stores/session'

const session = useSessionStore()
const router = useRouter()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const signupDone = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await session.signInWithEmail(email.value, password.value)
      router.push('/')
    } else {
      await session.signUpWithEmail(email.value, password.value)
      try {
        // 이메일 인증 미사용 시 즉시 로그인
        await session.signInWithEmail(email.value, password.value)
        router.push('/')
      } catch {
        // 이메일 인증 필요 시 확인 안내 화면 표시
        signupDone.value = true
      }
    }
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}

function toggleMode() {
  mode.value = mode.value === 'login' ? 'signup' : 'login'
  error.value = ''
  signupDone.value = false
}
</script>

<template>
  <div class="login">
    <div class="login__card">
      <img src="@/app/assets/logo.png" alt="방탈출 리뷰 로고" class="login__logo" />
      <p class="login__desc">지인들과 방탈출 기록을 공유해보세요</p>

      <!-- 가입 완료 안내 -->
      <div v-if="signupDone" class="login__notice">
        <p>가입 완료!</p>
        <p class="login__notice-sub">확인 메일을 발송했습니다.<br />메일 인증 후 로그인해 주세요.</p>
        <button class="login__link-btn" @click="toggleMode">로그인하기</button>
      </div>

      <!-- 이메일 폼 -->
      <form v-else class="login__form" @submit.prevent="submit">
        <input
          v-model="email"
          type="email"
          placeholder="이메일"
          class="login__input"
          required
          autocomplete="email"
        />
        <input
          v-model="password"
          type="password"
          placeholder="비밀번호 (6자 이상)"
          class="login__input"
          required
          minlength="6"
          autocomplete="current-password"
        />
        <p v-if="error" class="login__error">{{ error }}</p>
        <button type="submit" class="login__submit-btn" :disabled="loading">
          {{ loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입' }}
        </button>
      </form>

      <button v-if="!signupDone" class="login__link-btn" @click="toggleMode">
        {{ mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인' }}
      </button>

      <!-- 구분선 -->
      <div v-if="!signupDone" class="login__divider"><span>또는</span></div>

      <!-- Google 로그인 -->
      <button v-if="!signupDone" class="login__google-btn" @click="session.signInWithGoogle()">
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
  gap: 16px;
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

.login__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.login__input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  box-sizing: border-box;
}

.login__input:focus {
  border-color: #4a90d9;
}

.login__error {
  font-size: 0.8125rem;
  color: #e53935;
  margin: 0;
}

.login__submit-btn {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #4a90d9;
  color: #fff;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

.login__submit-btn:hover:not(:disabled) {
  background: #357abd;
}

.login__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login__link-btn {
  background: none;
  border: none;
  color: #4a90d9;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
}

.login__link-btn:hover {
  text-decoration: underline;
}

.login__divider {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #ccc;
  font-size: 0.8125rem;
}

.login__divider::before,
.login__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #eee;
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

.login__notice {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.login__notice p {
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
}

.login__notice-sub {
  font-size: 0.875rem;
  color: #666;
  line-height: 1.5;
  font-weight: 400 !important;
}
</style>
