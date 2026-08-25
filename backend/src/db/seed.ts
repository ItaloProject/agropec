// @ts-nocheck
import { db } from './index'
import { usuarios, insumos, estoque, lotes, fornecedores } from './schema'

async function seed() {
  console.log('ðŸŒ± Iniciando seed...')

  const senhaHash = await Bun.password.hash('123456')
  const [usuario] = await db.insert(usuarios).values({
    nome: 'JoÃ£o Silva',
    email: 'joao@agropec.com',
    senhaHash,
    nomePropriedade: 'Fazenda Boa Vista',
    especies: ['bovino', 'suino'],
  }).returning()

  console.log(`ðŸ‘¤ UsuÃ¡rio criado: ${usuario.email}`)

  await db.insert(fornecedores).values({
    usuarioId: usuario.id,
    nome: 'AgropecuÃ¡ria Cerrado',
    telefone: '(64) 99999-0000',
  }).returning()

  const insumosData = await db.insert(insumos).values([
    {
      usuarioId: usuario.id,
      nome: 'RaÃ§Ã£o Engorda Bovinos 30%',
      tipo: 'racao',
      unidade: 'kg',
      proteÃ­naBrutaPct: 30,
      energiaMetab: 2.9,
      custoPorUnidade: 1.85,
    },
    {
      usuarioId: usuario.id,
      nome: 'Milho GrÃ£o',
      tipo: 'concentrado',
      unidade: 'kg',
      proteÃ­naBrutaPct: 8.5,
      energiaMetab: 3.4,
      custoPorUnidade: 0.92,
    },
    {
      usuarioId: usuario.id,
      nome: 'RaÃ§Ã£o SuÃ­nos TerminaÃ§Ã£o',
      tipo: 'racao',
      unidade: 'kg',
      proteÃ­naBrutaPct: 16,
      energiaMetab: 3.3,
      custoPorUnidade: 1.65,
    },
    {
      usuarioId: usuario.id,
      nome: 'Suplemento Mineral Bovinos',
      tipo: 'suplemento',
      unidade: 'kg',
      custoPorUnidade: 4.50,
    },
    {
      usuarioId: usuario.id,
      nome: 'Ivermectina 1%',
      tipo: 'medicamento',
      unidade: 'L',
      custoPorUnidade: 28.00,
    },
  ]).returning()

  await db.insert(estoque).values([
    { usuarioId: usuario.id, insumoId: insumosData[0].id, qtdAtual: 2500, qtdMinimaAlerta: 500 },
    { usuarioId: usuario.id, insumoId: insumosData[1].id, qtdAtual: 5000, qtdMinimaAlerta: 1000 },
    { usuarioId: usuario.id, insumoId: insumosData[2].id, qtdAtual: 1800, qtdMinimaAlerta: 400 },
    { usuarioId: usuario.id, insumoId: insumosData[3].id, qtdAtual: 300, qtdMinimaAlerta: 50 },
    { usuarioId: usuario.id, insumoId: insumosData[4].id, qtdAtual: 10, qtdMinimaAlerta: 2 },
  ])

  await db.insert(lotes).values([
    {
      usuarioId: usuario.id,
      nome: 'Confinamento Lote A',
      codigo: 'BOV-2024-A',
      especie: 'bovino',
      finalidade: 'corte',
      fase: 'engorda',
      localizacao: 'Curral 1',
      qtdInicial: 80,
      qtdAtual: 78,
      dataEntrada: '2024-10-01',
      pesoMedioEntrada: 320,
      pesoMedioAtual: 395,
    },
    {
      usuarioId: usuario.id,
      nome: 'TerminaÃ§Ã£o SuÃ­nos T1',
      codigo: 'SUI-2024-T1',
      especie: 'suino',
      finalidade: 'corte',
      fase: 'terminacao',
      localizacao: 'GalpÃ£o 2',
      qtdInicial: 120,
      qtdAtual: 118,
      dataEntrada: '2024-11-15',
      pesoMedioEntrada: 70,
      pesoMedioAtual: 98,
    },
  ])

  console.log('âœ… Seed concluÃ­do!')
  console.log('ðŸ“§ Login: joao@agropec.com | Senha: 123456')
  process.exit(0)
}

seed().catch(console.error)
