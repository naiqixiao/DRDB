import Vue from 'vue'
import Vuex from 'vuex'
<% if (options.persist) { %>import createPersistedState from 'vuex-persistedstate'<% } %>

Vue.use(Vuex)

/* eslint-disable no-new */
const store = new Vuex.Store({
<% if (options.persist) { %>  plugins: [createPersistedState()],
<% } %>  modules: {
  }
})

export default store
