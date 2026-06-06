import { createRouter, createWebHashHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/',             redirect: '/despensa' },
    { path: '/despensa',     component: () => import('../views/DespensaView.vue') },
    { path: '/compras',      component: () => import('../views/ComprasView.vue') },
    { path: '/recetas',      component: () => import('../views/RecetarioView.vue') },
    { path: '/nutricion',    component: () => import('../views/NutricionView.vue') },
    { path: '/metricas',     component: () => import('../views/MetricasView.vue') },
    { path: '/planificador', component: () => import('../views/PlanificadorView.vue') },
    { path: '/perfiles',     component: () => import('../views/PerfilesView.vue') },
  ],
})
