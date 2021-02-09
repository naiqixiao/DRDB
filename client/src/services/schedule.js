import api from "./api";
import store from "@/store";

export default {
  create(schedule) {
    schedule.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }

    return api().post("schedule/add", schedule);
  },
  search(schedule) {
    schedule.lab = store.state.lab;
    return api().get("schedule/", {
      params: schedule,
    });
  },
  today(schedule) {
    schedule.lab = store.state.lab;
    return api().get("schedule/today", {
      params: schedule,
    });
  },
  tomorrow(schedule) {
    schedule.lab = store.state.lab;
    return api().get("schedule/tomorrow", {
      params: schedule,
    });
  },
  week(schedule) {
    schedule.lab = store.state.lab;
    return api().get("schedule/week", {
      params: schedule,
    });
  },
  update(schedule) {
    schedule.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    schedule.lab = store.state.lab;
    return api().post("schedule/", schedule);
  },
  complete(schedule) {
    schedule.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    schedule.lab = store.state.lab;
    return api().post("schedule/complete", schedule);
  },
  remind(schedule) {
    schedule.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    schedule.lab = store.state.lab;
    return api().post("schedule/remind", schedule);
  },
  delete(schedule) {
    schedule.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    schedule.lab = store.state.lab;
    return api().delete("schedule/", {
      params: schedule,
    });
  },
};
