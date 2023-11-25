// eslint-disable-next-line no-unused-vars
module.exports = (api, options, rootOptions) => {
  api.injectImports(api.entryFile, 'import store from \'./store\'');
  api.injectRootOptions(api.entryFile, 'store');

  api.extendPackage({
    dependencies: {
      vuex: '^3.0.1',
    },
  });

  if (options.persist) {
    api.extendPackage({
      dependencies: {
        'vuex-persistedstate': '^2.5.4',
      },
    });
  }

  api.render('./template/init');
};
