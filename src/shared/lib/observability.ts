import type { App } from 'vue'
import type { Router } from 'vue-router'
import * as Sentry from '@sentry/vue'
import { inject as vercelInject } from '@vercel/analytics'

/**
 * 에러 추적·분석 도구 초기화.
 *
 * Sentry: `VITE_SENTRY_DSN` 환경 변수가 있으면 활성화. 없으면 조용히 스킵
 *   (개발 환경/로컬 빌드에서 노이즈 없음).
 * Vercel Analytics: 자동 식별. 로컬에서는 자동으로 비활성.
 */
export function initObservability(app: App, router: Router) {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  const release = import.meta.env.VITE_RELEASE as string | undefined

  if (dsn) {
    Sentry.init({
      app,
      dsn,
      release,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration({ router }),
      ],
      // 1.0 = 모든 트랜잭션 추적. 트래픽 늘면 0.1 등으로 낮춤.
      tracesSampleRate: 1.0,
      // 404/네트워크 끊김 등은 노이즈라 제외.
      ignoreErrors: [
        /Network request failed/i,
        /Failed to fetch/i,
        /Load failed/i,
      ],
    })
  }

  // Vercel Analytics — Vercel 배포 환경에서만 실제 데이터 송신. 로컬은 자동 no-op.
  vercelInject()
}
