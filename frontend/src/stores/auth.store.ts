import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

export type Especie = 'bovino' | 'peixe' | 'suino' | 'ave' | 'ovino' | 'equino'

interface Usuario {
  id: number
  nome: string
  email: string
  nomePropriedade?: string
  especies: Especie[]
}

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<Usuario | null>(null)
  const token = ref<string | null>(localStorage.getItem('agropec:token'))

  const logado = computed(() => !!token.value)
  const especies = computed(() => usuario.value?.especies ?? [])

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha })
    token.value = data.token
    usuario.value = data.usuario
    localStorage.setItem('agropec:token', data.token)
    localStorage.setItem('agropec:usuario', JSON.stringify(data.usuario))
  }

  async function register(payload: {
    nome: string
    email: string
    senha: string
    nomePropriedade?: string
    especies: Especie[]
  }) {
    const { data } = await api.post('/auth/register', payload)
    token.value = data.token
    usuario.value = data.usuario
    localStorage.setItem('agropec:token', data.token)
    localStorage.setItem('agropec:usuario', JSON.stringify(data.usuario))
  }

  function logout() {
    token.value = null
    usuario.value = null
    localStorage.removeItem('agropec:token')
    localStorage.removeItem('agropec:usuario')
    window.location.hash = '#/login'
  }

  function carregarSessao() {
    const saved = localStorage.getItem('agropec:usuario')
    if (saved) usuario.value = JSON.parse(saved)
  }

  return { usuario, token, logado, especies, login, register, logout, carregarSessao }
})
