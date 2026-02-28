<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'default'
  }>(),
  {
    message: '',
    confirmLabel: '확인',
    cancelLabel: '취소',
    variant: 'default',
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('cancel')
}

watch(
  () => props.visible,
  (v) => {
    if (v) document.addEventListener('keydown', onKeydown)
    else document.removeEventListener('keydown', onKeydown)
  },
)

onMounted(() => {
  if (props.visible) document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-dialog">
      <div v-if="visible" class="confirm-overlay" @click="emit('cancel')">
        <div class="confirm-card" role="dialog" aria-modal="true" @click.stop>
          <h3 class="confirm-card__title">{{ title }}</h3>
          <p v-if="message" class="confirm-card__message">{{ message }}</p>
          <div class="confirm-card__actions">
            <button class="confirm-card__btn confirm-card__btn--cancel" @click="emit('cancel')">
              {{ cancelLabel }}
            </button>
            <button
              class="confirm-card__btn"
              :class="variant === 'danger' ? 'confirm-card__btn--danger' : 'confirm-card__btn--primary'"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
  padding: 20px;
}

.confirm-card {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: 28px 24px 20px;
  max-width: 320px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.confirm-card__title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px;
}

.confirm-card__message {
  font-size: 0.875rem;
  color: var(--color-text-sub);
  line-height: 1.5;
  margin: 0 0 20px;
}

.confirm-card__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.confirm-card__btn {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--transition-fast), opacity var(--transition-fast);
}

.confirm-card__btn--cancel {
  background: var(--color-bg);
  color: var(--color-text-sub);
}

.confirm-card__btn--cancel:hover {
  background: var(--color-bg-subtle);
}

.confirm-card__btn--primary {
  background: var(--color-primary);
  color: #fff;
}

.confirm-card__btn--primary:hover {
  background: var(--color-primary-dark);
}

.confirm-card__btn--danger {
  background: var(--color-error);
  color: #fff;
}

.confirm-card__btn--danger:hover {
  opacity: 0.9;
}

/* Transition */
.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-dialog-enter-active .confirm-card,
.confirm-dialog-leave-active .confirm-card {
  transition: transform 0.2s ease;
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}

.confirm-dialog-enter-from .confirm-card {
  transform: scale(0.95);
}

.confirm-dialog-leave-to .confirm-card {
  transform: scale(0.95);
}
</style>
