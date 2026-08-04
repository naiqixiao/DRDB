import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  // create(personnelInfo) {
  //   personnelInfo.User = {
  //     
  //     Name: useMainStore().name,
  //     Email: useMainStore().user,
  //     LabName: useMainStore().labName
  //   }
  //   return api().post("personnel/add", personnelInfo);
  // },
  search(personnelInfo) {
    return api().get("personnel/", {
      params: personnelInfo
    });
  },
  
  getStats(id) {
    return api().get("personnel/stats", {
      params: { id }
    });
  },
  getHistory(id) {
    return api().get(`personnel/${id}/history`);
  },
  createHistory(id, entry) {
    return api().post(`personnel/${id}/history`, entry);
  },
  updateHistory(id, entryId, entry) {
    return api().patch(`personnel/${id}/history/${entryId}`, entry);
  },
  deleteHistory(id, entryId) {
    return api().delete(`personnel/${id}/history/${entryId}`);
  },
  update(personnelInfo) {
    personnelInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("personnel/", personnelInfo);
  },
  delete(personnelInfo) {
    
    personnelInfo.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().delete("personnel/", {
      params: personnelInfo
    });
  }
};
