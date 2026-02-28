<script setup lang="ts">
import { useToastStore } from '@/shared/model/toast'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/vue/24/outline'

const toast = useToastStore()
</script>

<template>
  <Teleport to="body">
    <Transition name="app-toast">
      <div
        v-if="toast.current"
        :key="toast.current.id"
        class="app-toast"
        :class="`app-toast--${toast.current.type}`"
        role="status"
        aria-live="polite"
      >
        <CheckCircleIcon v-if="toast.current.type === 'success'" class="app-toast__icon" />
        <ExclamationCircleIcon v-if="toast.current.type === 'error'" class="app-toast__icon" />
        <InformationCircleIcon v-if="toast.current.type === 'info'" class="app-toast__icon" />
        <span class="app-toast__message">{{ toast.current.message }}</span>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.app-toast {
  position: fixed;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 99px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.app-toast--success {
  background: var(--color-success);
  color: #fff;
}

.app-toast--error {
  background: var(--color-error);
  color: #fff;
}

.app-toast--info {
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
}

.app-toast__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.app-toast__message {
  line-height: 1.3;
}

.app-toast-enter-active,
.app-toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

@media (min-width: 640px) {
  .app-toast {
    bottom: 32px;
  }
}
</style>
