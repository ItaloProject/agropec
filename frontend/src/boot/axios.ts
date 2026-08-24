import { boot } from 'quasar/wrappers'
import axios, { type AxiosInstance } from 'axios'

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
    $api: AxiosInstance
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export default boot(({ app }) => {
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('agropec:token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  api.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('agropec:token')
        window.location.hash = '#/login'
      }
      return Promise.reject(err)
    }
  )

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
