import api from './api'

export default {
  register (credentials) {
    return api().post('user/signup', credentials)
  },
  login (credentials) {
    return api().post('user/login', credentials)
  }
}