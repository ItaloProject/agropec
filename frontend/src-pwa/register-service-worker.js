import { register } from 'register-service-worker'

register(process.env.SERVICE_WORKER_FILE, {
  updated (registration) {
    document.dispatchEvent(
      new CustomEvent('pwa-updated', { detail: registration })
    )
  },
})
