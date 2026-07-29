<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, useId } from "vue";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  modelValue: string | number;
  options: Array<{ value: string | number; label: string }>;
  variant?: "pill" | "input";
  /** 스크린리더용 접근명 (combobox label) */
  ariaLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string | number];
}>();

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const activeIndex = ref(-1);

const baseId = useId();
const listboxId = `${baseId}-listbox`;
const optionId = (i: number) => `${baseId}-opt-${i}`;

const selectedLabel = computed(
  () => props.options.find((o) => o.value === props.modelValue)?.label ?? "",
);
const selectedIndex = computed(() =>
  props.options.findIndex((o) => o.value === props.modelValue),
);

function open(idx: number) {
  isOpen.value = true;
  activeIndex.value = idx >= 0 ? idx : 0;
}

function close() {
  isOpen.value = false;
}

function toggle() {
  if (isOpen.value) close();
  else open(selectedIndex.value);
}

function select(value: string | number) {
  emit("update:modelValue", value);
  close();
}

/** 키보드 조작: 네이티브 select를 대체한 커스텀 위젯의 표준 listbox 상호작용 */
function onKey(e: KeyboardEvent) {
  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      if (!isOpen.value) open(selectedIndex.value);
      else activeIndex.value = Math.min(props.options.length - 1, activeIndex.value + 1);
      break;
    case "ArrowUp":
      e.preventDefault();
      if (!isOpen.value) open(selectedIndex.value >= 0 ? selectedIndex.value : props.options.length - 1);
      else activeIndex.value = Math.max(0, activeIndex.value - 1);
      break;
    case "Home":
      if (isOpen.value) { e.preventDefault(); activeIndex.value = 0; }
      break;
    case "End":
      if (isOpen.value) { e.preventDefault(); activeIndex.value = props.options.length - 1; }
      break;
    case "Enter":
    case " ":
    case "Spacebar":
      e.preventDefault();
      if (!isOpen.value) open(selectedIndex.value);
      else {
        const opt = props.options[activeIndex.value];
        if (opt) select(opt.value);
      }
      break;
    case "Escape":
      if (isOpen.value) { e.preventDefault(); close(); }
      break;
    case "Tab":
      close();
      break;
  }
}

function onClickOutside(e: MouseEvent) {
  if (!wrapperRef.value?.contains(e.target as Node)) {
    close();
  }
}

onMounted(() => document.addEventListener("mousedown", onClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", onClickOutside));
</script>

<template>
  <div
    ref="wrapperRef"
    class="base-select"
    :class="{ 'base-select--input': variant === 'input' }"
  >
    <button
      type="button"
      class="base-select__trigger"
      :class="{
        'base-select__trigger--open': isOpen,
        'base-select__trigger--input': variant === 'input',
      }"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="listboxId"
      :aria-label="ariaLabel"
      :aria-activedescendant="isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined"
      @click="toggle"
      @keydown="onKey"
    >
      <span class="base-select__label" :class="{ 'base-select__label--pill': variant !== 'input' }">{{ selectedLabel }}</span>
      <ChevronDownIcon
        class="base-select__chevron"
        :class="{ 'base-select__chevron--open': isOpen }"
      />
    </button>

    <Transition name="dropdown">
      <ul v-if="isOpen" :id="listboxId" class="base-select__menu" role="listbox">
        <li
          v-for="(option, i) in options"
          :key="option.value"
          :id="optionId(i)"
          class="base-select__option"
          :class="{
            'base-select__option--selected': option.value === modelValue,
            'base-select__option--active': i === activeIndex,
          }"
          role="option"
          :aria-selected="option.value === modelValue"
          @click="select(option.value)"
          @mouseenter="activeIndex = i"
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
  gap: 4px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 99px;
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1;
  background: var(--color-surface);
  color: var(--color-text-sub);
  cursor: pointer;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast);
  outline: none;
  white-space: nowrap;
  user-select: none;
}

.base-select__trigger:hover,
.base-select__trigger--open {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
}

.base-select__trigger--open {
  box-shadow: var(--control-focus-ring);
}

/* 키보드 포커스 표시 (base에서 outline:none으로 지운 것을 되살림) */
.base-select__trigger:focus-visible {
  outline: 2px solid var(--brand-500);
  outline-offset: 2px;
}

.base-select__label--pill {
  position: relative;
  top: -0.5px;
}

.base-select__chevron {
  width: 12px;
  height: 12px;
  color: var(--color-text-muted);
  transition:
    transform 0.2s,
    color var(--transition-fast);
  flex-shrink: 0;
}

.base-select__trigger:hover .base-select__chevron,
.base-select__trigger--open .base-select__chevron {
  color: var(--color-primary);
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
  max-height: 240px;
  overflow-y: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card-hover);
  padding: 4px;
  margin: 0;
  list-style: none;
}

.base-select__option {
  padding: 9px 14px;
  font-size: 0.875rem;
  color: var(--color-text);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background var(--transition-fast),
    color var(--transition-fast);
  white-space: nowrap;
}

.base-select__option:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
}

.base-select__option--selected {
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
  font-weight: 600;
}

/* 키보드 화살표로 이동 중인 옵션 (마우스 hover와 동일한 강조) */
.base-select__option--active {
  background: var(--color-primary-bg);
  color: var(--color-primary-dark);
}

/* input variant */
.base-select--input {
  display: block;
  width: 100%;
}

.base-select__trigger--input {
  width: 100%;
  border-radius: var(--control-radius);
  min-height: var(--control-height);
  padding: 0 14px;
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
  justify-content: space-between;
}

/* 드롭다운 열기/닫기 애니메이션 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition:
    opacity 0.15s,
    transform 0.15s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
