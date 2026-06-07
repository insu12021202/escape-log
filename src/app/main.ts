import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { pinia } from './pinia'
import { initObservability } from '@/shared/lib/observability'
import './styles/global.css'

const app = createApp(App)
app.use(pinia)
app.use(router)
initObservability(app, router)
app.mount('#app')
