<script setup lang="ts">
// RoomSearchPage — /room/search  Spec: §2.1, §4.1
import { ref, computed, watch, onMounted } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { searchRooms, createRoom } from '@/entities/room/api'
import type { Room } from '@/entities/room/types'
import { fetchVendors, findOrCreateVendor } from '@/entities/vendor/api'
import type { Vendor } from '@/entities/vendor/types'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'
import { useToastStore } from '@/shared/model/toast'

const toast = useToastStore()

const keyword = ref('')
const rooms = ref<Room[]>([])
const loading = ref(false)
const searchError = ref(false)

// 방 등록 폼
const vendors = ref<Vendor[]>([])
const selectedVendorId = ref('')
const isNewVendor = ref(false)
const newVendorName = ref('')
const newVendorRegion = ref('')
const newThemeName = ref('')
const showForm = ref(false)
const registering = ref(false)
const registerError = ref<string | null>(null)

const vendorOptions = computed(() => [
  { value: '', label: '업체를 선택하세요' },
  ...vendors.value.map((v) => ({ value: v.id, label: `${v.name} (${v.region})` })),
])

onMounted(async () => {
  vendors.value = await fetchVendors()
})

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
  const vendorName = isNewVendor.value ? newVendorName.value.trim() : ''
  const vendorRegion = isNewVendor.value ? newVendorRegion.value.trim() : ''
  const hasVendor = isNewVendor.value ? (!!vendorName && !!vendorRegion) : !!selectedVendorId.value

  if (!hasVendor || !newThemeName.value.trim()) {
    registerError.value = isNewVendor.value
      ? '업체명, 지역, 테마명을 모두 입력해주세요.'
      : '업체를 선택하고 테마명을 입력해주세요.'
    return
  }
  registering.value = true
  registerError.value = null
  try {
    let vendorId: string
    if (isNewVendor.value) {
      const vendor = await findOrCreateVendor(vendorName, vendorRegion)
      vendorId = vendor.id
      if (!vendors.value.find((v) => v.id === vendor.id)) {
        vendors.value.push(vendor)
      }
    } else {
      vendorId = selectedVendorId.value
    }

    const created = await createRoom({
      vendorId,
      themeName: newThemeName.value.trim(),
    })
    rooms.value = [created, ...rooms.value]
    newThemeName.value = ''
    selectedVendorId.value = ''
    newVendorName.value = ''
    newVendorRegion.value = ''
    isNewVendor.value = false
    showForm.value = false
    toast.success('방이 등록되었습니다.')
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

    <!-- 검색 입력 + 등록 버튼 -->
    <div class="room-search__toolbar">
      <input
        v-model="keyword"
        class="room-search__input"
        type="text"
        placeholder="업체명, 테마명, 지역으로 검색"
      />
      <button class="room-search__toggle-btn" @click="showForm = !showForm">
        <XMarkIcon v-if="showForm" class="room-search__toggle-icon" />
        <PlusIcon v-else class="room-search__toggle-icon" />
        {{ showForm ? '닫기' : '등록' }}
      </button>
    </div>

    <!-- 방 등록 폼 -->
    <form v-if="showForm" class="room-search__form" @submit.prevent="submitNewRoom">
      <div class="room-search__field">
        <label class="room-search__label">업체 (지역)</label>
        <template v-if="!isNewVendor">
          <BaseSelect v-model="selectedVendorId" :options="vendorOptions" variant="input" />
          <button type="button" class="room-search__link-btn" @click="isNewVendor = true">
            + 새 업체 직접 입력
          </button>
        </template>
        <template v-else>
          <div class="room-search__row">
            <input
              v-model="newVendorName"
              class="room-search__input"
              type="text"
              placeholder="업체명 (예: 키이스케이프)"
            />
            <input
              v-model="newVendorRegion"
              class="room-search__input room-search__input--short"
              type="text"
              placeholder="지역 (예: 홍대)"
            />
          </div>
          <button type="button" class="room-search__link-btn" @click="isNewVendor = false; newVendorName = ''; newVendorRegion = ''">
            기존 업체에서 선택
          </button>
        </template>
      </div>
      <div class="room-search__field">
        <label class="room-search__label">테마명</label>
        <input
          v-model="newThemeName"
          class="room-search__input"
          type="text"
          placeholder="예) 셜록홈즈: 마지막 사건"
        />
      </div>
      <p v-if="registerError" class="room-search__error">{{ registerError }}</p>
      <button type="submit" class="room-search__submit-btn" :disabled="registering">
        {{ registering ? '등록 중...' : '등록' }}
      </button>
    </form>

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

.room-search__toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.room-search__toolbar .room-search__input {
  flex: 1;
}

.room-search__toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  border: 1px solid #4a90d9;
  border-radius: 8px;
  background: #fff;
  color: #4a90d9;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
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
  padding: 16px;
  background: #f9fafb;
  border: 1px solid #eee;
  border-radius: 8px;
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

.room-search__row {
  display: flex;
  gap: 8px;
}

.room-search__input--short {
  max-width: 120px;
}

.room-search__link-btn {
  align-self: flex-start;
  font-size: 0.8125rem;
  color: #4a90d9;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}

.room-search__link-btn:hover {
  color: #3a7bc8;
}
</style>
