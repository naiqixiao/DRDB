import api from "./api";
import { useMainStore } from "@/stores/mainStore";

export default {
  create(conversation) {
    conversation.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().post("conversation/", conversation);
  },
  delete(conversation) {

    conversation.User = {
      
      Name: useMainStore().name,
      Email: useMainStore().user,
      LabName: useMainStore().labName
    }
    return api().delete("conversation/", { params: conversation });
  }
};
