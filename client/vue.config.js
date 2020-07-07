const path = require("path");

module.exports = {
  transpileDependencies: ["vuetify"],
  // outputDir: path.resolve(__dirname, "../server/public"),
<<<<<<< HEAD
  // devServer: {
  //   proxy: {
  //     "/api": {
  //       target: "http://localhost:3000/",
  //       pathRewrite: {
  //         "^/api": "",
  //       },
  //     },
  //   },
  // },
=======
  devServer: {
    proxy: {
      "/api": {
        // target: "http://192.168.1.126:3000/",
        // target: "http://localhost:3000/",
        // pathRewrite: {
        //   "^/api": "",
        // },
      },
    },
  },
>>>>>>> 9e03d99094f3988fd267e4b350feecc73b155fe9
};
