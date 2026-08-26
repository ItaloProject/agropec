import { boot } from 'quasar/wrappers'
import { Notify } from 'quasar'

export default boot(() => {
  if (!('serviceWorker' in navigator)) return

  document.addEventListener('pwa-updated', (e: Event) => {
    const registration = (e as CustomEvent<ServiceWorkerRegistration>).detail

    Notify.create({
      type: 'info',
      icon: 'system_update',
      message: 'NOVA VERSÃO DISPONÍVEL',
      caption: 'ATUALIZE PARA TER AS ÚLTIMAS MELHORIAS.',
      timeout: 0,
      position: 'top',
      actions: [
        {
          label: 'ATUALIZAR AGORA',
          color: 'white',
          handler: () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
            window.location.reload()
          },
        },
        {
          label: 'DEPOIS',
          color: 'grey-3',
        },
      ],
    })
  })
})
