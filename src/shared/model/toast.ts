import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

export const useToastStore = defineStore('toast', () => {
  const current = ref<ToastItem | null>(null)
  let nextId = 0
  let dismissTimer: ReturnType<typeof setTimeout> | null = null
  const queue: ToastItem[] = []

  function _activate(item: ToastItem) {
    current.value = item
    if (dismissTimer) clearTimeout(dismissTimer)
    dismissTimer = setTimeout(() => {
      dismiss()
    }, 2500)
  }

  function show(message: string, type: ToastType = 'info') {
    const item: ToastItem = { id: nextId++, message, type }
    if (current.value) {
      queue.push(item)
    } else {
      _activate(item)
    }
  }

  function dismiss() {
    if (dismissTimer) {
      clearTimeout(dismissTimer)
      dismissTimer = null
    }
    current.value = null

    if (queue.length > 0) {
      const next = queue.shift()!
      setTimeout(() => _activate(next), 300)
    }
  }

  function success(message: string) { show(message, 'success') }
  function error(message: string) { show(message, 'error') }
  function info(message: string) { show(message, 'info') }

  return { current, show, dismiss, success, error, info }
})
