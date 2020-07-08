const path = require("path");

module.exports = {
  transpileDependencies: ["vuetify"],
  // outputDir: path.resolve(__dirname, "../server/public"),
  devServer: {
    proxy: {
      "/api": {
        target: "http://192.168.1.126:3000/",
        // pathRewrite: {
        //   "^/api": "",
        // },
      },
    },
  },
};
