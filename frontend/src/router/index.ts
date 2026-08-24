import { route } from 'quasar/wrappers'
import { createRouter, createWebHashHistory } from 'vue-router'
import routes from './routes'

export default route(function () {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHashHistory(process.env.VUE_ROUTER_BASE),
  })

  Router.beforeEach((to) => {
    const token = localStorage.getItem('agropec:token')
    if (to.meta.requiresAuth && !token) return { path: '/login' }
    if (to.path === '/login' && token) return { path: '/dashboard' }
  })

  return Router
})
