import api from "./api";

export default {
  create(conversation) {
    return api().post("conversation/", conversation);
  },
  delete(conversationId) {
    return api().delete("conversation/", { params: { id: conversationId } });
  }
};
