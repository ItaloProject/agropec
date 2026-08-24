import { Elysia, t } from 'elysia'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { usuarios } from '../db/schema'
import { jwtPlugin } from '../middleware/auth'

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)

  .post(
    '/register',
    async ({ body, jwt, set }) => {
      const existente = await db.query.usuarios.findFirst({
        where: eq(usuarios.email, body.email),
      })

      if (existente) {
        set.status = 409
        return { erro: 'E-mail já cadastrado' }
      }

      const senhaHash = await Bun.password.hash(body.senha)
      const [usuario] = await db
        .insert(usuarios)
        .values({
          nome: body.nome,
          email: body.email,
          senhaHash,
          nomePropriedade: body.nomePropriedade,
          especies: body.especies ?? [],
        })
        .returning()

      const token = await jwt.sign({ sub: usuario.id, email: usuario.email })
      return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, especies: usuario.especies } }
    },
    {
      body: t.Object({
        nome: t.String({ minLength: 2 }),
        email: t.String({ format: 'email' }),
        senha: t.String({ minLength: 6 }),
        nomePropriedade: t.Optional(t.String()),
        especies: t.Optional(t.Array(t.String())),
      }),
    }
  )

  .post(
    '/login',
    async ({ body, jwt, set }) => {
      const usuario = await db.query.usuarios.findFirst({
        where: eq(usuarios.email, body.email),
      })

      if (!usuario) {
        set.status = 401
        return { erro: 'Credenciais inválidas' }
      }

      const senhaValida = await Bun.password.verify(body.senha, usuario.senhaHash)
      if (!senhaValida) {
        set.status = 401
        return { erro: 'Credenciais inválidas' }
      }

      const token = await jwt.sign({ sub: usuario.id, email: usuario.email })
      return {
        token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          nomePropriedade: usuario.nomePropriedade,
          especies: usuario.especies,
        },
      }
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        senha: t.String(),
      }),
    }
  )
