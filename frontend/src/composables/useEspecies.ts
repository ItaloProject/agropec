export type Especie = 'bovino' | 'peixe' | 'suino' | 'ave' | 'ovino' | 'equino'

export interface EspecieConfig {
  valor: Especie
  label: string
  emoji: string
  cor: string
  unidadePeso: string
  terminologia: {
    animal: string
    animais: string
    lote: string
    peso: string
    conversaoAlimentar: string
  }
}

export const ESPECIES: EspecieConfig[] = [
  {
    valor: 'bovino',
    label: 'Bovinos',
    emoji: '🐄',
    cor: '#5d4037',
    unidadePeso: 'kg',
    terminologia: {
      animal: 'boi / vaca',
      animais: 'cabeças',
      lote: 'curral / lote',
      peso: 'kg / arroba',
      conversaoAlimentar: 'CA (kg ração/kg ganho)',
    },
  },
  {
    valor: 'peixe',
    label: 'Piscicultura',
    emoji: '🐟',
    cor: '#0277bd',
    unidadePeso: 'g',
    terminologia: {
      animal: 'peixe',
      animais: 'unidades',
      lote: 'tanque',
      peso: 'biomassa (kg)',
      conversaoAlimentar: 'CA (kg ração/kg ganho)',
    },
  },
  {
    valor: 'suino',
    label: 'Suínos',
    emoji: '🐷',
    cor: '#e91e63',
    unidadePeso: 'kg',
    terminologia: {
      animal: 'suíno',
      animais: 'cabeças',
      lote: 'baia / galpão',
      peso: 'kg',
      conversaoAlimentar: 'CA (kg ração/kg ganho)',
    },
  },
  {
    valor: 'ave',
    label: 'Avicultura',
    emoji: '🐔',
    cor: '#f57c00',
    unidadePeso: 'g',
    terminologia: {
      animal: 'ave',
      animais: 'aves',
      lote: 'galpão / lote',
      peso: 'g / kg',
      conversaoAlimentar: 'CA (kg ração/kg ganho)',
    },
  },
  {
    valor: 'ovino',
    label: 'Ovinos/Caprinos',
    emoji: '🐑',
    cor: '#9e9e9e',
    unidadePeso: 'kg',
    terminologia: {
      animal: 'ovino / caprino',
      animais: 'cabeças',
      lote: 'rebanho',
      peso: 'kg',
      conversaoAlimentar: 'CA (kg ração/kg ganho)',
    },
  },
  {
    valor: 'equino',
    label: 'Equinos',
    emoji: '🐴',
    cor: '#795548',
    unidadePeso: 'kg',
    terminologia: {
      animal: 'cavalo / égua',
      animais: 'animais',
      lote: 'piquete / baia',
      peso: 'kg',
      conversaoAlimentar: 'consumo/dia (kg)',
    },
  },
]

export function useEspecies() {
  function getConfig(especie: Especie): EspecieConfig {
    return ESPECIES.find(e => e.valor === especie) ?? ESPECIES[0]!
  }

  function getEmoji(especie: string): string {
    return ESPECIES.find(e => e.valor === especie)?.emoji ?? '🐾'
  }

  function getLabel(especie: string): string {
    return ESPECIES.find(e => e.valor === especie)?.label ?? especie
  }

  return { ESPECIES, getConfig, getEmoji, getLabel }
}
