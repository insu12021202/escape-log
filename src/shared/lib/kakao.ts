declare const Kakao: {
  init: (key: string) => void
  isInitialized: () => boolean
  Share: {
    sendDefault: (options: {
      objectType: string
      content: {
        title: string
        description: string
        imageUrl: string
        link: { mobileWebUrl: string; webUrl: string }
      }
      buttons: Array<{
        title: string
        link: { mobileWebUrl: string; webUrl: string }
      }>
    }) => void
  }
}

let initialized = false

function initKakao() {
  if (initialized) return
  const key = import.meta.env.VITE_KAKAO_JS_KEY as string | undefined
  if (!key || typeof Kakao === 'undefined') return
  if (!Kakao.isInitialized()) Kakao.init(key)
  initialized = true
}

export interface ShareReviewParams {
  token: string
  vendorName: string
  themeName: string
  rating: number
  summary: string
  isSuccess: boolean
}

/**
 * 카카오톡 공유. Spec: §6
 * - share_token이 있는 리뷰에만 호출할 것
 * - Kakao SDK 미로드 시 링크 복사로 폴백
 */
export async function shareReviewViaKakao(params: ShareReviewParams): Promise<'kakao' | 'shared' | 'copied' | 'failed'> {
  const shareUrl = `${window.location.origin}/share/${params.token}`
  const ogImage = `${window.location.origin}/logo.png`

  initKakao()

  const title = `${params.vendorName} · ${params.themeName}`
  const desc = `★${params.rating} | ${params.summary}`

  if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description: desc,
        imageUrl: ogImage,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        {
          title: '리뷰 보기',
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      ],
    })
    return 'kakao'
  }

  // 폴백 1: Web Share API (모바일 네이티브 공유 시트)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: desc,
        url: shareUrl,
      })
      return 'shared'
    } catch {
      // 사용자가 취소한 경우 — 다음 폴백으로
    }
  }

  // 폴백 2: Clipboard API (HTTPS 전용)
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(shareUrl)
      return 'copied'
    } catch {
      // HTTPS여도 실패할 수 있음 — 다음 폴백으로
    }
  }

  // 폴백 3: execCommand (HTTP에서도 동작)
  try {
    const ta = document.createElement('textarea')
    ta.value = shareUrl
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok ? 'copied' : 'failed'
  } catch {
    return 'failed'
  }
}
