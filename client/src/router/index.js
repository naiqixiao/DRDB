import { createRouter, createWebHashHistory } from 'vue-router'

// Views - Lazy loaded
const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/Login.vue')
const Family = () => import('@/views/Family.vue')
const Appointment = () => import('@/views/Appointment.vue')
const Schedule = () => import('@/views/Schedule.vue')
const Personnel = () => import('@/views/Personnel.vue')
const Study = () => import('@/views/Study.vue')
const Settings = () => import('@/views/Settings.vue')
const EmailTest = () => import('@/views/EmailTest.vue')
const CalendarTest = () => import('@/views/CalendarTest.vue')
const Setup = () => import('@/views/Setup.vue')

const routes = [
    {
        path: '/',
        name: 'Login',
        component: Login
    },
    {
        path: '/home',
        name: 'Home',
        component: Home
    },
    {
        path: '/family',
        name: 'Family information',
        component: Family
    },
    {
        path: '/appointment',
        name: 'Study appointments',
        component: Appointment
    },
    {
        path: '/schedule',
        name: 'Schedule studies',
        component: Schedule
    },
    {
        path: '/personnel',
        name: 'Personnel management',
        component: Personnel
    },
    {
        path: '/study/:id?',
        name: 'Study management',
        component: Study
    },
    {
        path: '/settings',
        name: 'Settings',
        component: Settings
    },
    {
        path: '/email-test',
        name: 'Email Test',
        component: EmailTest
    },
    {
        path: '/calendar-test',
        name: 'Calendar Test',
        component: CalendarTest
    },
    {
        path: '/setup',
        name: 'Setup Wizard',
        component: Setup
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

import { useMainStore } from '@/stores/mainStore'

router.beforeEach((to, from, next) => {
  const authStore = useMainStore()
  
  // If they are logged in BUT have a temporary password AND it is the first run, force them to the setup wizard
  if (authStore.isUserLoggedIn && authStore.temporaryPassword && authStore.isFirstRun && to.path !== '/setup') {
    next('/setup');
  } 
  // If they somehow try to go to /setup but don't need to, send them to the dashboard
  else if (to.path === '/setup' && (!authStore.temporaryPassword || !authStore.isFirstRun)) {
    next('/family');
  } 
  else {
    next();
  }
});

export default router
