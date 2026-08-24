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

const PORT = Number(process.env.PORT ?? 3001)

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:9000',
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

  .listen(PORT)

console.log(`🐄 Agropec API rodando em http://localhost:${PORT}`)
