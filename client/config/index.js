module.exports = {
  build: {
    env: require('./prod.env'),
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    productionSourceMap: true,
    // Gzip off by default as many popular static hosts such as
    // Surge or Netlify already gzip all static assets for you.
    // Before setting to `true`, make sure to:
    // npm install --save-dev compression-webpack-plugin
    productionGzip: false,
    productionGzipExtensions: ['js', 'css'],
    // Run the build command with an extra argument to
    // View the bundle analyzer report after build finishes:
    // `npm run build --report`
    // Set to `true` or `false` to always turn it on or off
    bundleAnalyzerReport: process.env.npm_config_report
  },
  dev: {
    env: require("./dev.env"),
    port: 8080,
    autoOpenBrowser: true,
    assetsSubDirectory: "static",
    assetsPublicPath: "/",
    proxyTable: {},
    cssSourceMap: false,
    proxyTable: {
      // "/api": {
      //   target: "http://192.168.1.126:3000/", // 你要请求的后端接口ip+port
      //   changeOrigin: true, // 允许跨域，在本地会创建一个虚拟服务端，然后发送请求的数据，并同时接收请求的数据，这样服务端和服务端进行数据的交互就不会有跨域问题
      //   ws: true, // 开启webSocket
      //   pathRewrite: {
      //     "^/api": "", // 替换成target中的地址
      //   },
      // },
    },
  },
};
