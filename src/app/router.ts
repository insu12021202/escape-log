import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
