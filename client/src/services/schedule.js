import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(schedule) {
    schedule.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }

    return api().post("schedule/add", schedule);
  },
  search(schedule) {
    schedule.lab = useMainStore().lab;
    return api().get("schedule/", {
      params: schedule,
    });
  },
  searchFollowUps(schedule) {
    schedule.lab = useMainStore().lab;
    return api().get("schedule/followups", {
      params: schedule,
    });
  },
  today(schedule) {
    schedule.lab = useMainStore().lab;
    return api().get("schedule/today", {
      params: schedule,
    });
  },
  tomorrow(schedule) {
    schedule.lab = useMainStore().lab;
    return api().get("schedule/tomorrow", {
      params: schedule,
    });
  },
  week(schedule) {
    schedule.lab = useMainStore().lab;
    return api().get("schedule/week", {
      params: schedule,
    });
  },
  upcoming(limit = 7) {
    return api().get("schedule/upcoming", {
      params: {
        lab: useMainStore().lab,
        trainingMode: useMainStore().trainingMode,
        limit,
      },
    });
  },
  update(schedule) {
    schedule.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    schedule.lab = useMainStore().lab;
    return api().post("schedule/", schedule);
  },
  complete(schedule) {
    schedule.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    schedule.lab = useMainStore().lab;
    return api().post("schedule/complete", schedule);
  },
  remind(schedule) {
    schedule.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    schedule.lab = useMainStore().lab;
    return api().post("schedule/remind", schedule);
  },
  tyEmail(schedule) {
    schedule.User = {
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    schedule.lab = useMainStore().lab;
    return api().post("schedule/tyEmail", schedule);
  },
  delete(schedule) {
    schedule.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    schedule.lab = useMainStore().lab;
    return api().delete("schedule/", {
      params: schedule,
    });
  },
};
