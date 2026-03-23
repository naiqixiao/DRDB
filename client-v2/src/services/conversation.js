import api from "./api";
import store from "@/store";

export default {
  create(conversation) {
    conversation.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().post("conversation/", conversation);
  },
  delete(conversation) {

    conversation.User = {
      
      Name: store.state.name,
      Email: store.state.user,
      LabName: store.state.labName
    }
    return api().delete("conversation/", { params: conversation });
  }
};
