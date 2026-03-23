import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    token: null,
    user: null,
    name: null,
    userID: null,
    lab: null,
    studies: null,
    isUserLoggedIn: false,
    role: null,
    labEmail: null,
    labName: null,
    labEmailStatus: null,
    adminEmailStatus: null,
    loadingStatus: false,
    emailOpening: null,
    emailClosing: null,
    tyEmailClosing: null,
    location: null,
    transportationInstructions: null,
    ZoomLink: null,
    trainingMode: false,
    timeZone: null,
    testingRooms: null
  }),
  
  persist: true,

  actions: {
    setToken(token) {
      this.token = token;
      this.isUserLoggedIn = !!token;
    },
    setUser(user) { this.user = user; },
    setName(name) { this.name = name; },
    setUserID(userID) { this.userID = userID; },
    setLab(lab) { this.lab = lab; },
    setStudies(studies) { this.studies = studies; },
    setLabEmail(labEmail) { this.labEmail = labEmail; },
    setLabName(labName) { this.labName = labName; },
    setRole(role) { this.role = role; },
    setLabEmailStatus(status) { this.labEmailStatus = status; },
    setAdminEmailStatus(status) { this.adminEmailStatus = status; },
    setLoadingStatus(status) { this.loadingStatus = status; },
    setEmailOpening(opening) { this.emailOpening = opening; },
    setEmailClosing(closing) { this.emailClosing = closing; },
    setTYEmailClosing(closing) { this.tyEmailClosing = closing; },
    setLocation(location) { this.location = location; },
    setTransportationInstructions(instructions) { this.transportationInstructions = instructions; },
    setZoomLink(link) { this.ZoomLink = link; },
    setTrainingMode(mode) { this.trainingMode = mode; },
    setTimeZone(zone) { this.timeZone = zone; },
    setTestingRooms(rooms) { this.testingRooms = rooms; },
    
    clearAll() {
      this.$reset();
    }
  }
})
