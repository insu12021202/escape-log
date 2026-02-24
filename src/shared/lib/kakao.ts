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
export async function shareReviewViaKakao(params: ShareReviewParams): Promise<'kakao' | 'copied' | 'failed'> {
  const shareUrl = `${window.location.origin}/share/${params.token}`
  const ogImage = `${window.location.origin}/logo.png`

  initKakao()

  if (typeof Kakao !== 'undefined' && Kakao.isInitialized()) {
    const outcomeLabel = params.isSuccess ? '탈출 성공' : '탈출 실패'
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: `${params.vendorName} · ${params.themeName}`,
        description: `${outcomeLabel} ★${params.rating} | ${params.summary}`,
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

  // Kakao SDK 없을 때 URL 복사 폴백
  try {
    await navigator.clipboard.writeText(shareUrl)
    return 'copied'
  } catch {
    return 'failed'
  }
}
