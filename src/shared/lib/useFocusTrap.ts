import { onUnmounted, watch, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * 모달·라이트박스 등 한정된 영역에 키보드 포커스를 가두는 composable.
 *
 * `isActive`가 true로 바뀌면:
 *   1. 직전 포커스 요소 기억
 *   2. container 안 첫 포커스 가능 요소로 이동
 *   3. Tab / Shift+Tab을 container 끝/처음에서 순환시킴
 *
 * `isActive`가 false로 바뀌면 직전 포커스 요소로 복귀.
 */
export function useFocusTrap(
  containerRef: Ref<HTMLElement | null | undefined>,
  isActive: Ref<boolean>,
) {
  let previousFocus: HTMLElement | null = null

  function focusable(): HTMLElement[] {
    const el = containerRef.value
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const nodes = focusable()
    if (nodes.length === 0) {
      e.preventDefault()
      return
    }
    const first = nodes[0]!
    const last = nodes[nodes.length - 1]!
    const active = document.activeElement as HTMLElement | null

    if (e.shiftKey) {
      if (active === first || !containerRef.value?.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last || !containerRef.value?.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  function activate() {
    previousFocus = document.activeElement as HTMLElement | null
    // 다음 틱에 DOM이 완전히 그려진 후 포커스
    queueMicrotask(() => {
      const nodes = focusable()
      nodes[0]?.focus()
    })
    document.addEventListener('keydown', onKeydown)
  }

  function deactivate() {
    document.removeEventListener('keydown', onKeydown)
    previousFocus?.focus()
    previousFocus = null
  }

  watch(
    isActive,
    (v) => {
      if (v) activate()
      else deactivate()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    document.removeEventListener('keydown', onKeydown)
  })
}
