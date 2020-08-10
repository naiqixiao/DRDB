import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

Vue.use(Vuex);

export default new Vuex.Store({
  strict: true,
  plugins: [createPersistedState()],
  state: {
    token: null,
    user: null,
    userID: null,
    lab: null,
    studies: null,
    isUserLoggedIn: false,
    role: null,
    labEmail: null,
    labName: null,
    labEmailStatus: null,
    adminEmailStatus: null,
  },
  mutations: {
    setToken(state, token) {
      state.token = token;
      state.isUserLoggedIn = !!token;
    },
    setUser(state, user) {
      state.user = user;
    },
    setUserID(state, userID) {
      state.userID = userID;
    },
    setLab(state, lab) {
      state.lab = lab;
    },
    setStudies(state, studies) {
      state.studies = studies;
    },
    setLabEmail(state, labEmail) {
      state.labEmail = labEmail;
    },
    setLabName(state, labName) {
      state.labName = labName;
    },
    setRole(state, role) {
      state.role = role;
    },
    setLabEmailStatus(state, labEmailStatus) {
      state.labEmailStatus = labEmailStatus;
    },
    setAdminEmailStatus(state, adminEmailStatus) {
      state.adminEmailStatus = adminEmailStatus;
    },
  },
  actions: {
    setToken({ commit }, token) {
      commit("setToken", token);
    },
    setUser({ commit }, user) {
      commit("setUser", user);
    },
    setUserID({ commit }, userID) {
      commit("setUserID", userID);
    },
    setLab({ commit }, lab) {
      commit("setLab", lab);
    },
    setStudies({ commit }, studies) {
      commit("setStudies", studies);
    },
    setLabEmail({ commit }, labEmail) {
      commit("setLabEmail", labEmail);
    },
    setLabName({ commit }, labName) {
      commit("setLabName", labName);
    },
    setRole({ commit }, role) {
      commit("setRole", role);
    },
    setLabEmailStatus({ commit }, labEmailStatus) {
      commit("setLabEmailStatus", labEmailStatus);
    },
    setAdminEmailStatus({ commit }, adminEmailStatus) {
      commit("setAdminEmailStatus", adminEmailStatus);
    },
  },
});
