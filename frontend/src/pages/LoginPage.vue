<template>
  <div class="login-bg">
    <div class="login-card">
      <div class="login-hero">
        <div style="font-size:3rem">🌾</div>
        <h1 class="login-title">Agropec</h1>
        <p class="login-sub">Gestão de criação animal</p>
      </div>

      <q-tabs v-model="tab" indicator-color="primary" align="justify">
        <q-tab name="login" label="Entrar" />
        <q-tab name="cadastro" label="Cadastrar" />
      </q-tabs>

      <q-separator />

      <div class="q-pa-md">
        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="login" class="q-pa-none">
            <q-form @submit="fazerLogin" class="q-gutter-sm q-mt-sm">
              <q-input
                v-model="loginForm.email"
                type="email"
                label="E-mail"
                outlined
                :rules="[v => !!v]"
              />
              <q-input
                v-model="loginForm.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                label="Senha"
                outlined
                :rules="[v => !!v]"
              >
                <template #append>
                  <q-icon
                    :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="mostrarSenha = !mostrarSenha"
                  />
                </template>
              </q-input>
              <q-btn
                type="submit"
                color="primary"
                label="Entrar"
                unelevated
                class="full-width q-mt-sm"
                :loading="carregando"
              />
            </q-form>
          </q-tab-panel>

          <q-tab-panel name="cadastro" class="q-pa-none">
            <q-form @submit="fazerCadastro" class="q-gutter-sm q-mt-sm">
              <q-input v-model="cadForm.nome" label="Seu nome *" outlined :rules="[v => !!v]" />
              <q-input v-model="cadForm.email" type="email" label="E-mail *" outlined :rules="[v => !!v]" />
              <q-input
                v-model="cadForm.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                label="Senha (mínimo 6 caracteres) *"
                outlined
                :rules="[v => v.length >= 6 || 'Mínimo 6 caracteres']"
              >
                <template #append>
                  <q-icon :name="mostrarSenha ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="mostrarSenha = !mostrarSenha" />
                </template>
              </q-input>
              <q-input v-model="cadForm.nomePropriedade" label="Nome da propriedade" outlined />

              <div class="section-title q-mt-md">O que você cria? (pode marcar mais de um)</div>
              <div class="chip-bar">
                <div
                  v-for="e in ESPECIES"
                  :key="e.valor"
                  class="especie-chip"
                  :class="{ active: cadForm.especies.includes(e.valor) }"
                  @click="toggleEspecie(e.valor)"
                >
                  {{ e.emoji }} {{ e.label }}
                </div>
              </div>

              <q-btn
                type="submit"
                color="primary"
                label="Criar conta"
                unelevated
                class="full-width q-mt-md"
                :loading="carregando"
                :disable="!cadForm.especies.length"
              />
            </q-form>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'
import { ESPECIES } from 'src/composables/useEspecies'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const tab = ref('login')
const carregando = ref(false)
const mostrarSenha = ref(false)

const loginForm = ref({ email: '', senha: '' })
const cadForm = ref({ nome: '', email: '', senha: '', nomePropriedade: '', especies: [] as string[] })

function toggleEspecie(especie: string) {
  const idx = cadForm.value.especies.indexOf(especie)
  if (idx >= 0) cadForm.value.especies.splice(idx, 1)
  else cadForm.value.especies.push(especie)
}

async function fazerLogin() {
  carregando.value = true
  try {
    await authStore.login(loginForm.value.email, loginForm.value.senha)
    router.push('/dashboard')
  } catch {
    $q.notify({ type: 'negative', message: 'E-mail ou senha incorretos' })
  } finally {
    carregando.value = false
  }
}

async function fazerCadastro() {
  carregando.value = true
  try {
    await authStore.register(cadForm.value as any)
    router.push('/dashboard')
  } catch (e: any) {
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao cadastrar' })
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-card {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 420px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
}
.login-hero {
  padding: 32px 20px 20px;
  text-align: center;
  background: linear-gradient(135deg, #f9fbe7, #e8f5e9);
}
.login-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1b5e20;
  margin: 8px 0 4px;
}
.login-sub { color: #558b2f; font-size: .9rem; margin: 0; }
.chip-bar { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
