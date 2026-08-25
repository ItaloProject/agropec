// @ts-nocheck
import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const JWT_SECRET = process.env.JWT_SECRET ?? 'agropec-dev-secret-troque-em-producao'

export const jwtPlugin = new Elysia({ name: 'jwt' }).use(
  jwt({
    name: 'jwt',
    secret: JWT_SECRET,
    exp: '7d',
  })
)

export const authGuard = new Elysia({ name: 'auth-guard' })
  .use(jwtPlugin)
  .derive({ as: 'scoped' }, async ({ jwt, headers, set }) => {
    const authHeader = headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      throw new Error('Token de autenticação ausente')
    }

    const token = authHeader.slice(7)
    const payload = await jwt.verify(token)

    if (!payload) {
      set.status = 401
      throw new Error('Token inválido ou expirado')
    }

    return { usuarioId: payload.sub as number, usuarioEmail: payload.email as string }
  })
