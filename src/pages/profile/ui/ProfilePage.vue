<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import { useSessionStore } from '@/app/stores/session'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'

const session = useSessionStore()
const router = useRouter()

const showLogoutDialog = ref(false)

const displayName = computed(() => {
  const user = session.user
  if (!user) return ''
  return user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? ''
})

const avatarLetter = computed(() => displayName.value.charAt(0).toUpperCase() || '?')

async function handleSignOut() {
  showLogoutDialog.value = false
  await session.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="profile-page">
    <!-- 유저 정보 -->
    <div class="profile-page__user">
      <div class="profile-page__avatar">{{ avatarLetter }}</div>
      <p class="profile-page__name">{{ displayName }}</p>
    </div>

    <!-- 링크 목록 -->
    <div class="profile-page__section">
      <RouterLink to="/room/search" class="profile-page__item">
        <MagnifyingGlassIcon class="profile-page__item-icon" />
        <span>방 검색</span>
      </RouterLink>
    </div>

    <!-- 로그아웃 -->
    <div class="profile-page__section">
      <button class="profile-page__item profile-page__item--danger" @click="showLogoutDialog = true">
        로그아웃
      </button>
    </div>

    <!-- 로그아웃 확인 -->
    <ConfirmDialog
      :visible="showLogoutDialog"
      title="로그아웃"
      message="정말 로그아웃할까요?"
      confirm-label="로그아웃"
      cancel-label="취소"
      @confirm="handleSignOut"
      @cancel="showLogoutDialog = false"
    />
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-page__user {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 0 8px;
  gap: 12px;
}

.profile-page__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  font-size: 1.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-page__name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}

.profile-page__section {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.profile-page__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.profile-page__item:hover {
  background: var(--color-bg);
}

.profile-page__item--danger {
  color: var(--color-error);
}

.profile-page__item-icon {
  width: 20px;
  height: 20px;
  color: var(--color-text-sub);
  flex-shrink: 0;
}
</style>
