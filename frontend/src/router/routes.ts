import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('src/pages/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',       redirect: '/dashboard' },
      { path: 'dashboard',    component: () => import('src/pages/DashboardPage.vue') },
      { path: 'lotes',        component: () => import('src/pages/LotesPage.vue') },
      { path: 'alimentacao',  component: () => import('src/pages/AlimentacaoPage.vue') },
      { path: 'estoque',      component: () => import('src/pages/EstoquePage.vue') },
      { path: 'compras',      component: () => import('src/pages/ComprasPage.vue') },
      { path: 'saude',        component: () => import('src/pages/SaudePage.vue') },
      { path: 'animais',      component: () => import('src/pages/AnimaisPage.vue') },
      { path: 'pesagem',      component: () => import('src/pages/PesagemPage.vue') },
      { path: 'relatorios',   component: () => import('src/pages/RelatoriosPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/dashboard',
  },
]

export default routes
