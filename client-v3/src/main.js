import { createApp } from 'vue'
import './style.css'
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
                    primary: '#344955',
                    secondary: '#F9AA33',
                    tertiary: '#4A6572',
                    quaternary: '#4A6572',
                    background: '#B2B2B2',
                    textbackground: '#f4f4f4',
                    warning: '#cc3300',
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
