<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSessionStore } from '@/app/stores/session'
import { ERRORS } from '@/shared/lib/messages'

const session = useSessionStore()
const router = useRouter()
const route = useRoute()

const mode = ref<'login' | 'signup'>('login')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const signupDone = ref(false)
const termsAgreed = ref(false)
const privacyAgreed = ref(false)

/** 가입 시에만 양쪽 동의 필요. */
const canSubmit = computed(
  () => mode.value === 'login' || (termsAgreed.value && privacyAgreed.value),
)

/**
 * 로그인 후 복귀할 경로. router 가드에서 ?redirect=/share/abc 식으로 보존.
 * Open redirect 방지: 같은 origin(슬래시로 시작 + 슬래시슬래시 아님)만 허용.
 */
function safeRedirect(): string {
  const raw = route.query.redirect
  if (typeof raw !== 'string') return '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

/** Supabase 인증 에러 원문을 사용자 친화 한국어로 변환. */
function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요'
  if (m.includes('already registered') || m.includes('already been registered')) return '이미 가입된 이메일이에요'
  if (m.includes('email not confirmed')) return '메일 인증 후 로그인해 주세요'
  if (m.includes('rate limit') || m.includes('too many')) return '잠시 후 다시 시도해 주세요'
  return ERRORS.generic
}

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await session.signInWithEmail(email.value, password.value)
      router.push(safeRedirect())
    } else {
      await session.signUpWithEmail(email.value, password.value)
      try {
        // 이메일 인증 미사용 시 즉시 로그인
        await session.signInWithEmail(email.value, password.value)
        router.push(safeRedirect())
      } catch {
        // 이메일 인증 필요 시 확인 안내 화면 표시
        signupDone.value = true
      }
    }
  } catch (e) {
    error.value = mapAuthError((e as Error).message)
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
        <p class="login__notice-sub">확인 메일을 보냈어요.<br />메일 인증 후 로그인해 주세요.</p>
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
          :aria-invalid="!!error"
          :aria-describedby="error ? 'login-error' : undefined"
        />
        <input
          v-model="password"
          type="password"
          placeholder="비밀번호 (6자 이상)"
          class="login__input"
          required
          minlength="6"
          autocomplete="current-password"
          :aria-invalid="!!error"
          :aria-describedby="error ? 'login-error' : undefined"
        />
        <p v-if="error" id="login-error" class="login__error" role="alert">{{ error }}</p>

        <!-- 회원가입 시 약관·개인정보 동의 -->
        <div v-if="mode === 'signup'" class="login__consent">
          <label class="login__consent-row">
            <input v-model="termsAgreed" type="checkbox" />
            <span>
              <RouterLink to="/terms" target="_blank" rel="noopener" class="login__policy-link">
                이용약관
              </RouterLink>
              에 동의합니다 (필수)
            </span>
          </label>
          <label class="login__consent-row">
            <input v-model="privacyAgreed" type="checkbox" />
            <span>
              <RouterLink to="/privacy" target="_blank" rel="noopener" class="login__policy-link">
                개인정보 처리방침
              </RouterLink>
              에 동의합니다 (필수)
            </span>
          </label>
        </div>

        <button type="submit" class="login__submit-btn" :disabled="loading || !canSubmit">
          {{ loading ? '처리 중…' : mode === 'login' ? '로그인' : '회원가입' }}
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

.login__consent {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.login__consent-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.8125rem;
  color: #555;
  line-height: 1.4;
  cursor: pointer;
}

.login__consent-row input {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  accent-color: #4a90d9;
}

.login__policy-link {
  color: #4a90d9;
  text-decoration: underline;
}

.login__policy-link:hover {
  color: #357abd;
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
