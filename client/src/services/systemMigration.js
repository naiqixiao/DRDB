import api from "@/services/api";

export default {
  exportMigration(passphrase) {
    return api().post("systemMigration/export", { passphrase }, { responseType: "blob", timeout: 0 });
  },
  importMigration(file, passphrase) {
    return api().post("systemMigration/import", file, {
      headers: {
        "Content-Type": "application/octet-stream",
        "X-Migration-Passphrase": passphrase,
        "X-Migration-Confirmation": "REPLACE THIS SYSTEM",
      },
      timeout: 0,
    });
  },
};
