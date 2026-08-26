<template>
  <div class="auth-root">
    <!-- Painel esquerdo — marca -->
    <div class="brand-panel">
      <div class="brand-content">
        <div class="brand-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="72" height="72">
            <rect width="100" height="100" rx="22" fill="rgba(255,255,255,0.15)"/>
            <line x1="50" y1="82" x2="50" y2="20" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="50" cy="22" rx="7" ry="10" fill="#f9a825"/>
            <ellipse cx="37" cy="34" rx="6" ry="9" fill="#f9a825" transform="rotate(-30 37 34)"/>
            <ellipse cx="33" cy="50" rx="6" ry="9" fill="#f9a825" transform="rotate(-25 33 50)"/>
            <ellipse cx="63" cy="34" rx="6" ry="9" fill="#f9a825" transform="rotate(30 63 34)"/>
            <ellipse cx="67" cy="50" rx="6" ry="9" fill="#f9a825" transform="rotate(25 67 50)"/>
            <path d="M50 82 Q40 88 32 90" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
          </svg>
        </div>
        <h1 class="brand-name">Agropec</h1>
        <p class="brand-tagline">Gestão de criação animal</p>

        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>Dashboard em tempo real</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🐄</span>
            <span>Controle de lotes e animais</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">🌿</span>
            <span>Gestão de alimentação e estoque</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">💊</span>
            <span>Saúde e pesagem integradas</span>
          </div>
        </div>
      </div>

      <div class="brand-circles">
        <div class="circle c1"></div>
        <div class="circle c2"></div>
        <div class="circle c3"></div>
      </div>
    </div>

    <!-- Painel direito — formulário -->
    <div class="form-panel">
      <!-- Logo mobile (só aparece no mobile) -->
      <div class="mobile-brand">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="52" height="52">
          <rect width="100" height="100" rx="22" fill="rgba(255,255,255,0.15)"/>
          <line x1="50" y1="82" x2="50" y2="20" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          <ellipse cx="50" cy="22" rx="7" ry="10" fill="#f9a825"/>
          <ellipse cx="37" cy="34" rx="6" ry="9" fill="#f9a825" transform="rotate(-30 37 34)"/>
          <ellipse cx="33" cy="50" rx="6" ry="9" fill="#f9a825" transform="rotate(-25 33 50)"/>
          <ellipse cx="63" cy="34" rx="6" ry="9" fill="#f9a825" transform="rotate(30 63 34)"/>
          <ellipse cx="67" cy="50" rx="6" ry="9" fill="#f9a825" transform="rotate(25 67 50)"/>
          <path d="M50 82 Q40 88 32 90" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" fill="none"/>
        </svg>
        <div class="mobile-brand-text">
          <div class="mobile-brand-name">AGROPEC</div>
          <div class="mobile-brand-sub">GESTÃO DE CRIAÇÃO ANIMAL</div>
        </div>
      </div>

      <div class="form-container">
        <div class="form-header">
          <h2 class="form-title">{{ tab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta' }}</h2>
          <p class="form-subtitle">{{ tab === 'login' ? 'Entre com suas credenciais para continuar' : 'Preencha os dados para começar gratuitamente' }}</p>
        </div>

        <!-- Seletor de modo -->
        <div class="tab-switcher">
          <button
            class="tab-btn"
            :class="{ active: tab === 'login' }"
            @click="tab = 'login'"
          >Entrar</button>
          <button
            class="tab-btn"
            :class="{ active: tab === 'cadastro' }"
            @click="tab = 'cadastro'"
          >Cadastrar</button>
        </div>

        <!-- Login -->
        <transition name="fade-slide" mode="out-in">
          <q-form v-if="tab === 'login'" key="login" @submit="fazerLogin" class="auth-form">
            <div class="field-group">
              <label class="field-label">E-mail</label>
              <q-input
                v-model="loginForm.email"
                type="email"
                placeholder="seu@email.com"
                outlined
                dense
                hide-bottom-space
                :rules="[v => !!v || '']"
                class="premium-input"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Senha</label>
              <q-input
                v-model="loginForm.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                placeholder="••••••••"
                outlined
                dense
                hide-bottom-space
                :rules="[v => !!v || '']"
                class="premium-input"
              >
                <template #append>
                  <q-icon
                    :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer toggle-icon"
                    @click="mostrarSenha = !mostrarSenha"
                  />
                </template>
              </q-input>
            </div>

            <q-btn
              type="submit"
              label="Entrar"
              unelevated
              class="submit-btn full-width"
              :loading="carregando"
            >
              <template #loading>
                <q-spinner-dots size="20px" color="white" />
              </template>
            </q-btn>

            <p class="switch-hint">
              Não tem conta?
              <span class="switch-link" @click="tab = 'cadastro'">Cadastre-se grátis</span>
            </p>
          </q-form>

          <!-- Cadastro -->
          <q-form v-else key="cadastro" @submit="fazerCadastro" class="auth-form">
            <div class="field-group">
              <label class="field-label">Nome completo</label>
              <q-input
                v-model="cadForm.nome"
                placeholder="João Silva"
                outlined
                dense
                hide-bottom-space
                :rules="[v => !!v || '']"
                class="premium-input"
              />
            </div>

            <div class="field-group">
              <label class="field-label">E-mail</label>
              <q-input
                v-model="cadForm.email"
                type="email"
                placeholder="seu@email.com"
                outlined
                dense
                hide-bottom-space
                :rules="[v => !!v || '']"
                class="premium-input"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Senha</label>
              <q-input
                v-model="cadForm.senha"
                :type="mostrarSenha ? 'text' : 'password'"
                placeholder="Mínimo 6 caracteres"
                outlined
                dense
                hide-bottom-space
                :rules="[v => v.length >= 6 || 'Mínimo 6 caracteres']"
                class="premium-input"
              >
                <template #append>
                  <q-icon :name="mostrarSenha ? 'visibility_off' : 'visibility'" class="cursor-pointer toggle-icon" @click="mostrarSenha = !mostrarSenha" />
                </template>
              </q-input>
            </div>

            <div class="field-group">
              <label class="field-label">Nome da propriedade <span class="optional">(opcional)</span></label>
              <q-input
                v-model="cadForm.nomePropriedade"
                placeholder="Fazenda Exemplo"
                outlined
                dense
                hide-bottom-space
                class="premium-input"
              />
            </div>

            <div class="field-group">
              <label class="field-label">O que você cria?</label>
              <div class="chip-grid">
                <div
                  v-for="e in ESPECIES"
                  :key="e.valor"
                  class="especie-chip"
                  :class="{ active: cadForm.especies.includes(e.valor) }"
                  @click="toggleEspecie(e.valor)"
                >
                  <span class="chip-emoji">{{ e.emoji }}</span>
                  <span>{{ e.label }}</span>
                </div>
              </div>
            </div>

            <q-btn
              type="submit"
              label="Criar conta"
              unelevated
              class="submit-btn full-width"
              :loading="carregando"
              :disable="!cadForm.especies.length"
            >
              <template #loading>
                <q-spinner-dots size="20px" color="white" />
              </template>
            </q-btn>

            <p class="switch-hint">
              Já tem conta?
              <span class="switch-link" @click="tab = 'login'">Entrar agora</span>
            </p>
          </q-form>
        </transition>
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
    $q.notify({ type: 'negative', message: 'E-mail ou senha incorretos', position: 'top' })
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
    $q.notify({ type: 'negative', message: e.response?.data?.erro ?? 'Erro ao cadastrar', position: 'top' })
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
/* ── Layout raiz ── */
.auth-root {
  min-height: 100vh;
  display: flex;
}

/* ── Painel esquerdo ── */
.brand-panel {
  position: relative;
  display: none;
  flex: 1;
  background: linear-gradient(145deg, #0a3d0a 0%, #1b5e20 45%, #2e7d32 100%);
  overflow: hidden;
  padding: 48px;
  flex-direction: column;
  justify-content: center;
}
@media (min-width: 768px) {
  .brand-panel { display: flex; }
}

.brand-content {
  position: relative;
  z-index: 2;
}

.brand-logo {
  margin-bottom: 24px;
}

.brand-name {
  font-size: 2.8rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.brand-tagline {
  font-size: 1.05rem;
  color: rgba(255,255,255,0.65);
  margin: 0 0 48px;
  font-weight: 400;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 14px;
  color: rgba(255,255,255,0.85);
  font-size: 0.95rem;
  font-weight: 500;
}

.feature-icon {
  font-size: 1.3rem;
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Círculos decorativos */
.brand-circles { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.06);
}
.c1 { width: 400px; height: 400px; bottom: -120px; right: -120px; }
.c2 { width: 250px; height: 250px; top: -60px; right: 60px; }
.c3 { width: 160px; height: 160px; bottom: 100px; left: -40px; }

/* ── Painel direito ── */
.form-panel {
  flex: 0 0 100%;
  background: linear-gradient(145deg, #0a3d0a 0%, #1b5e20 45%, #2e7d32 100%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-height: 100vh;
  overflow-y: auto;
}
@media (min-width: 768px) {
  .form-panel {
    flex: 0 0 480px;
    background: #ffffff;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    min-height: unset;
  }
}

/* ── Área da marca mobile ── */
.mobile-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 52px 28px 32px;
  width: 100%;
}
@media (min-width: 768px) {
  .mobile-brand { display: none; }
}

.mobile-brand-text { color: #fff; }
.mobile-brand-name {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 1px;
  line-height: 1;
}
.mobile-brand-sub {
  font-size: 0.65rem;
  letter-spacing: 1.5px;
  opacity: 0.8;
  margin-top: 4px;
}

.form-container {
  width: 100%;
  background: #ffffff;
  border-radius: 28px 28px 0 0;
  padding: 32px 28px 56px;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.25);
  flex: 1;
}
@media (min-width: 768px) {
  .form-container {
    max-width: 380px;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    flex: unset;
  }
}

/* ── Cabeçalho do formulário ── */
.form-header { margin-bottom: 28px; }

.form-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.form-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

/* ── Tab switcher ── */
.tab-switcher {
  display: flex;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 28px;
  gap: 4px;
}

.tab-btn {
  flex: 1;
  padding: 9px 12px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background: #ffffff;
  color: #1b5e20;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
}

/* ── Campos ── */
.auth-form { display: flex; flex-direction: column; gap: 4px; }

.field-group { margin-bottom: 16px; }

.field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.optional {
  font-weight: 400;
  color: #9ca3af;
  font-size: 0.75rem;
}

/* Override Quasar para parecer premium */
.premium-input :deep(.q-field__control) {
  border-radius: 10px;
  background: #f9fafb;
  border: 1.5px solid #e5e7eb;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.premium-input :deep(.q-field__control:hover) {
  border-color: #9ca3af;
}
.premium-input :deep(.q-field--focused .q-field__control) {
  border-color: #2e7d32;
  box-shadow: 0 0 0 3px rgba(46,125,50,0.12);
  background: #ffffff;
}
.premium-input :deep(.q-field__native) {
  font-size: 0.9rem;
  color: #111827;
}
.premium-input :deep(.q-field__native::placeholder) {
  color: #d1d5db;
}

.toggle-icon { color: #9ca3af; font-size: 1.1rem; }

/* ── Botão principal ── */
.submit-btn {
  margin-top: 8px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2e7d32, #1b5e20);
  color: #ffffff;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 14px rgba(27,94,32,0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}
.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(27,94,32,0.4);
}
.submit-btn:active { transform: translateY(0); }

/* ── Rodapé ── */
.switch-hint {
  text-align: center;
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 16px 0 0;
}

.switch-link {
  color: #2e7d32;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ── Chips de espécie ── */
.chip-grid { display: flex; flex-wrap: wrap; gap: 8px; }

.especie-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid #e5e7eb;
  background: #f9fafb;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.especie-chip:hover { border-color: #86efac; background: #f0fdf4; color: #166534; }

.especie-chip.active {
  border-color: #2e7d32;
  background: #dcfce7;
  color: #166534;
}

.chip-emoji { font-size: 1rem; }

/* ── Transição de painel ── */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to  { opacity: 0; transform: translateY(-8px); }
</style>
