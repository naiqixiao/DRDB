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

import router from './router'
import store from './store'

createApp(App)
    .use(vuetify)
    .use(router)
    .use(store)
    .use(parameters)
    .mount('#app')
