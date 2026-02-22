<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const props = defineProps<{
  modelValue: string | number
  options: Array<{ value: string | number; label: string }>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const isOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? '',
)

function toggle() {
  isOpen.value = !isOpen.value
}

function select(value: string | number) {
  emit('update:modelValue', value)
  isOpen.value = false
}

function onClickOutside(e: MouseEvent) {
  if (!wrapperRef.value?.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<template>
  <div ref="wrapperRef" class="base-select">
    <button type="button" class="base-select__trigger" :class="{ 'base-select__trigger--open': isOpen }" @click="toggle">
      <span class="base-select__label">{{ selectedLabel }}</span>
      <ChevronDownIcon class="base-select__chevron" :class="{ 'base-select__chevron--open': isOpen }" />
    </button>

    <Transition name="dropdown">
      <ul v-if="isOpen" class="base-select__menu">
        <li
          v-for="option in options"
          :key="option.value"
          class="base-select__option"
          :class="{ 'base-select__option--selected': option.value === modelValue }"
          @click="select(option.value)"
        >
          {{ option.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<style scoped>
.base-select {
  position: relative;
  display: inline-block;
}

.base-select__trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  background: #fafafa;
  color: #444;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  outline: none;
  white-space: nowrap;
  user-select: none;
}

.base-select__trigger:hover,
.base-select__trigger--open {
  border-color: #4a90d9;
  background: #f0f6ff;
  color: #2a6db5;
}

.base-select__trigger--open {
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.15);
}

.base-select__chevron {
  width: 14px;
  height: 14px;
  color: #999;
  transition: transform 0.2s, color 0.15s;
  flex-shrink: 0;
}

.base-select__trigger:hover .base-select__chevron,
.base-select__trigger--open .base-select__chevron {
  color: #4a90d9;
}

.base-select__chevron--open {
  transform: rotate(180deg);
}

.base-select__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  min-width: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 4px;
  margin: 0;
  list-style: none;
  overflow: hidden;
}

.base-select__option {
  padding: 8px 14px;
  font-size: 0.875rem;
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  white-space: nowrap;
}

.base-select__option:hover {
  background: #f0f6ff;
  color: #2a6db5;
}

.base-select__option--selected {
  background: #e8f2ff;
  color: #2a6db5;
  font-weight: 600;
}

/* 드롭다운 열기/닫기 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
