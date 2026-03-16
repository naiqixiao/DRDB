import { createApp } from 'vue'
import './style.css'
import './design-system.css'
import App from './App.vue'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

// Global parameters plugin
import parameters from './plugins/parameters'

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    primary: '#1E40AF',
                    secondary: '#3B82F6',
                    tertiary: '#607D8B',
                    quaternary: '#607D8B',
                    background: '#F8FAFC',
                    textbackground: '#FFFFFF',
                    warning: '#F59E0B',
                },
            },
        },
    },
})

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import router from './router'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(vuetify)
app.use(router)
app.use(pinia)
app.use(parameters)
app.mount('#app')
