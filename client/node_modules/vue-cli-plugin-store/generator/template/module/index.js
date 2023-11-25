<% if (options.folder) { %>import getters from './getters'
import mutations from './mutations'
import actions from './actions'

<% } %>export default {
  namespaced: true,
  state: {},
  getters<%if (!options.folder) { %>: {}<% } %>,
  mutations<%if (!options.folder) { %>: {}<% } %>,
  actions<%if (!options.folder) { %>: {}<% } %>
}
