<script setup lang="ts">
import { ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const { needRefresh, updateServiceWorker } = useRegisterSW()

const dismissed = ref(false)

function update() {
  updateServiceWorker()
}

function dismiss() {
  dismissed.value = true
  needRefresh.value = false
}
</script>

<template>
  <Transition name="pwa-prompt">
    <div v-if="needRefresh && !dismissed" class="pwa-prompt">
      <span class="pwa-prompt__text">새 버전이 있습니다.</span>
      <div class="pwa-prompt__actions">
        <button class="pwa-prompt__btn pwa-prompt__btn--update" @click="update">
          업데이트
        </button>
        <button class="pwa-prompt__btn pwa-prompt__btn--dismiss" @click="dismiss">
          나중에
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.pwa-prompt {
  position: fixed;
  bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 16px);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 900;
  max-width: calc(100vw - 32px);
}

.pwa-prompt__text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

.pwa-prompt__actions {
  display: flex;
  gap: 8px;
}

.pwa-prompt__btn {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--transition-fast);
}

.pwa-prompt__btn--update {
  background: var(--color-primary);
  color: #fff;
}

.pwa-prompt__btn--update:hover {
  background: var(--color-primary-dark);
}

.pwa-prompt__btn--dismiss {
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.pwa-prompt__btn--dismiss:hover {
  background: var(--color-bg-subtle);
}

.pwa-prompt-enter-active,
.pwa-prompt-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.pwa-prompt-enter-from,
.pwa-prompt-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}

@media (min-width: 640px) {
  .pwa-prompt {
    bottom: 32px;
  }
}
</style>
