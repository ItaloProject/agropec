import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { authRoutes } from './routes/auth'
import { lotesRoutes } from './routes/lotes'
import { alimentacaoRoutes } from './routes/alimentacao'
import { estoqueRoutes } from './routes/estoque'
import { pesagemRoutes } from './routes/pesagem'
import { comprasRoutes } from './routes/compras'
import { saudeRoutes } from './routes/saude'
import { animaisRoutes } from './routes/animais'
import { calcularKPIsDashboard } from './services/kpi.service'
import { authGuard } from './middleware/auth'

export const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL]
      : true,
    credentials: true,
  }))

  .get('/health', () => ({ status: 'ok', ts: new Date().toISOString() }))

  .use(authRoutes)

  .use(authGuard)
  .get('/dashboard', async ({ usuarioId }) => {
    return calcularKPIsDashboard(usuarioId)
  })

  .use(lotesRoutes)
  .use(alimentacaoRoutes)
  .use(estoqueRoutes)
  .use(pesagemRoutes)
  .use(comprasRoutes)
  .use(saudeRoutes)
  .use(animaisRoutes)
