<script setup lang="ts">
// RoomSearchPage — /room/search  Spec: §2.1, §4.1
import { ref, watch } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { searchRooms, createRoom } from '@/entities/room/api'
import type { Room } from '@/entities/room/types'
import AppSpinner from '@/shared/ui/AppSpinner.vue'

const keyword = ref('')
const rooms = ref<Room[]>([])
const loading = ref(false)
const searchError = ref(false)

const newRoom = ref({ vendorName: '', themeName: '', region: '' })
const showForm = ref(false)
const registering = ref(false)
const registerError = ref<string | null>(null)

async function doSearch() {
  loading.value = true
  searchError.value = false
  try {
    rooms.value = await searchRooms(keyword.value)
  } catch (e) {
    console.error(e)
    searchError.value = true
  } finally {
    loading.value = false
  }
}

// 입력할 때마다 검색 (debounce 없이 단순하게)
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(keyword, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(doSearch, 300)
})

// 초기 로드
doSearch()

async function submitNewRoom() {
  if (!newRoom.value.vendorName || !newRoom.value.themeName || !newRoom.value.region) {
    registerError.value = '업체명, 테마명, 지역을 모두 입력해주세요.'
    return
  }
  registering.value = true
  registerError.value = null
  try {
    const created = await createRoom(newRoom.value)
    rooms.value = [created, ...rooms.value]
    newRoom.value = { vendorName: '', themeName: '', region: '' }
    showForm.value = false
  } catch (e) {
    console.error(e)
    registerError.value = '방 등록 중 오류가 발생했습니다.'
  } finally {
    registering.value = false
  }
}
</script>

<template>
  <div class="room-search">
    <h2 class="room-search__title">방 검색</h2>

    <!-- 검색 입력 -->
    <input
      v-model="keyword"
      class="room-search__input"
      type="text"
      placeholder="업체명, 테마명, 지역으로 검색"
    />

    <!-- 검색 결과 -->
    <AppSpinner v-if="loading" />
    <p v-else-if="searchError" class="room-search__empty room-search__empty--error">
      방 목록을 불러오는 데 실패했습니다.
    </p>
    <ul v-else-if="rooms.length" class="room-search__list">
      <li v-for="room in rooms" :key="room.id" class="room-search__item">
        <span class="room-search__vendor">{{ room.vendorName }}</span>
        <span class="room-search__theme">{{ room.themeName }}</span>
        <span class="room-search__region">{{ room.region }}</span>
      </li>
    </ul>
    <p v-else class="room-search__empty">검색 결과가 없습니다.</p>

    <!-- 방 등록 -->
    <div class="room-search__register">
      <button class="room-search__toggle-btn" @click="showForm = !showForm">
        <XMarkIcon v-if="showForm" class="room-search__toggle-icon" />
        <PlusIcon v-else class="room-search__toggle-icon" />
        {{ showForm ? '닫기' : '새 방 등록' }}
      </button>

      <form v-if="showForm" class="room-search__form" @submit.prevent="submitNewRoom">
        <div class="room-search__field">
          <label class="room-search__label">업체명</label>
          <input
            v-model="newRoom.vendorName"
            class="room-search__input"
            type="text"
            placeholder="예) 넥스트에디션"
          />
        </div>
        <div class="room-search__field">
          <label class="room-search__label">테마명</label>
          <input
            v-model="newRoom.themeName"
            class="room-search__input"
            type="text"
            placeholder="예) 셜록홈즈: 마지막 사건"
          />
        </div>
        <div class="room-search__field">
          <label class="room-search__label">지역</label>
          <input
            v-model="newRoom.region"
            class="room-search__input"
            type="text"
            placeholder="예) 강남"
          />
        </div>
        <p v-if="registerError" class="room-search__error">{{ registerError }}</p>
        <button type="submit" class="room-search__submit-btn" :disabled="registering">
          {{ registering ? '등록 중...' : '등록' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.room-search {
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-search__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.room-search__input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9375rem;
  box-sizing: border-box;
}

.room-search__input:focus {
  outline: none;
  border-color: #4a90d9;
}

.room-search__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.room-search__item {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 12px 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}

.room-search__vendor {
  font-weight: 700;
  font-size: 0.9375rem;
  color: #222;
}

.room-search__theme {
  font-size: 0.9375rem;
  color: #555;
  flex: 1;
}

.room-search__region {
  font-size: 0.8125rem;
  color: #999;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.room-search__empty {
  font-size: 0.9375rem;
  color: #999;
  text-align: center;
  padding: 24px 0;
}

.room-search__empty--error {
  color: #e53935;
}

.room-search__register {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.room-search__toggle-btn {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #4a90d9;
  border-radius: 8px;
  background: #fff;
  color: #4a90d9;
  font-size: 0.9375rem;
  cursor: pointer;
}

.room-search__toggle-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.room-search__toggle-btn:hover {
  background: #e8f0fe;
}

.room-search__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-search__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.room-search__label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #444;
}

.room-search__error {
  font-size: 0.875rem;
  color: #e53935;
}

.room-search__submit-btn {
  padding: 10px;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
}

.room-search__submit-btn:hover:not(:disabled) {
  background: #3a7bc8;
}

.room-search__submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
