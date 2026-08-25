<template>
  <q-layout view="lHh LpR lff">
    <q-header class="main-header" elevated>
      <q-toolbar class="q-px-md">
        <q-btn flat round dense icon="menu" @click.stop="drawerOpen = !drawerOpen" class="q-mr-sm" />
        <div class="flex items-center gap-2">
          <span class="header-logo">🌾</span>
          <span class="header-brand">Agropec</span>
        </div>
        <q-space />
        <div v-if="authStore.usuario" class="flex items-center gap-2 gt-xs">
          <q-chip
            v-for="e in authStore.especies.slice(0, 4)"
            :key="e"
            dense
            color="green-9"
            text-color="white"
            :label="useEspecies().getEmoji(e)"
            class="q-mr-xs"
          />
          <span class="text-caption text-white opacity-80 q-ml-xs">{{ authStore.usuario.nomePropriedade }}</span>
        </div>
        <q-btn flat round icon="logout" @click="authStore.logout()" class="q-ml-sm" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawerOpen"
      :width="220"
      :breakpoint="900"
      bordered
      class="main-drawer"
    >
      <q-scroll-area class="fit">
        <div class="drawer-brand q-pa-md">
          <div class="drawer-logo">🌾</div>
          <div class="text-subtitle2 text-white text-center q-mt-xs">
            {{ authStore.usuario?.nomePropriedade ?? 'Minha Propriedade' }}
          </div>
          <div class="text-caption text-center opacity-60 text-white">
            {{ authStore.usuario?.nome }}
          </div>
        </div>

        <q-separator color="white" opacity="0.1" />

        <q-list class="q-py-sm">
          <q-item
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            clickable
            v-ripple
            active-class="nav-active"
            class="nav-item q-py-sm"
            :class="item.divider ? 'q-mt-sm' : ''"
          >
            <q-item-section avatar style="min-width:36px">
              <span class="nav-icon">{{ item.icon }}</span>
            </q-item-section>
            <q-item-section class="nav-label">{{ item.label }}</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="bottom-nav gt-xs-hide bg-white">
      <q-tabs
        :value="currentTab"
        indicator-color="primary"
        active-color="primary"
        align="justify"
        dense
      >
        <q-tab
          v-for="item in bottomNavItems"
          :key="item.to"
          :name="item.to"
          :to="item.to"
          no-caps
          class="bottom-tab"
        >
          <div class="bottom-tab-icon">{{ item.icon }}</div>
          <div class="bottom-tab-label">{{ item.label }}</div>
        </q-tab>
      </q-tabs>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'
import { useEspecies } from 'src/composables/useEspecies'

const authStore = useAuthStore()
const route = useRoute()
const $q = useQuasar()

const drawerOpen = ref(false)

function onDocClick(e: MouseEvent) {
  if (!drawerOpen.value) return
  const drawerEl = document.querySelector('.q-drawer')
  if (drawerEl?.contains(e.target as Node)) return
  drawerOpen.value = false
}

onMounted(() => {
  drawerOpen.value = $q.screen.width >= 900
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})

const navItems = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/lotes',       icon: '🏷️', label: 'Lotes & Animais' },
  { to: '/alimentacao', icon: '🌾', label: 'Alimentação' },
  { to: '/pesagem',     icon: '⚖️', label: 'Pesagem' },
  { to: '/saude',       icon: '💊', label: 'Saúde Animal' },
  { to: '/relatorios',  icon: '📋', label: 'Relatórios' },
]

const bottomNavItems = [
  { to: '/dashboard',   icon: '📊', label: 'Início' },
  { to: '/lotes',       icon: '🏷️', label: 'Lotes' },
  { to: '/alimentacao', icon: '🌾', label: 'Alimentação' },
  { to: '/pesagem',     icon: '⚖️', label: 'Pesagem' },
]

const currentTab = computed(() => route.path)
</script>

<style scoped>
.main-header {
  background: #1b5e20;
}

.header-logo {
  font-size: 1.5rem;
  line-height: 1;
}

.header-brand {
  font-size: 1.1rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.3px;
}

.main-drawer {
  background: #1b5e20 !important;
  color: white !important;
}

.drawer-brand {
  text-align: center;
  padding: 20px 16px 16px;
}

.drawer-logo {
  font-size: 2.4rem;
  line-height: 1;
}

.nav-item {
  color: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  margin: 1px 8px;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-active {
  background: rgba(129, 199, 132, 0.22) !important;
  color: #a5d6a7 !important;
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  font-size: 0.88rem;
  font-weight: 500;
}

.bottom-nav {
  border-top: 1px solid #e0e0e0;
  background: white !important;
}

.bottom-tab {
  padding: 6px 0;
}

.bottom-tab-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.bottom-tab-label {
  font-size: 0.6rem;
  margin-top: 2px;
  font-weight: 500;
}
</style>
