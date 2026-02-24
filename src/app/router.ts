import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/app/stores/session'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/login/ui/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'review-list',
    component: () => import('@/pages/review-list/ui/ReviewListPage.vue'),
  },
  {
    path: '/review/new',
    name: 'review-create',
    component: () => import('@/pages/review-create/ui/ReviewCreatePage.vue'),
  },
  {
    path: '/review/:id',
    name: 'review-detail',
    component: () => import('@/pages/review-detail/ui/ReviewDetailPage.vue'),
    props: true,
  },
  {
    path: '/review/:id/edit',
    name: 'review-edit',
    component: () => import('@/pages/review-edit/ui/ReviewEditPage.vue'),
    props: true,
  },
  {
    path: '/room/search',
    name: 'room-search',
    component: () => import('@/pages/room-search/ui/RoomSearchPage.vue'),
  },
  {
    path: '/share/:token',
    name: 'shared-review',
    component: () => import('@/pages/shared-review/ui/SharedReviewPage.vue'),
    props: true,
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/profile/ui/ProfilePage.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// 비로그인 시 /login으로 리다이렉트, 로그인 상태에서 /login 접근 시 홈으로  Spec: §5
router.beforeEach(async (to) => {
  const session = useSessionStore()
  if (!session.ready) await session.init()

  if (to.name === 'login' && session.user) return { name: 'review-list' }
  if (to.meta.public) return true
  if (!session.user) return { name: 'login' }
})
