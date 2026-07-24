import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/xzyjjm',
    },
    {
      path: '/xzyjjm',
      name: 'xzyjjm',
      component: () => import('../views/FineSlagCoal.vue'),
    },
    {
      path: '/ylyjm',
      name: 'ylyjm',
      component: () => import('../views/RawCoal.vue'),
    },
    {
      path: '/ghwng',
      name: 'ghwng',
      component: () => import('../views/DriedSludge.vue'),
    },
    {
      path: '/rlm',
      name: 'rlm',
      component: () => import('../views/FuelCoal.vue'),
    },
    {
      path: '/drxhdh',
      name: 'drxhdh',
      component: () => import('../views/DailyConsumption.vue'),
    },
  ],
})

export default router
