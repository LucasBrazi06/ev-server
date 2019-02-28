const commonConfig = require('./build/webpack.common');
const webpackMerge = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');

const addons = (addonsArg) => {
  let addons = []
    .concat.apply([], [addonsArg]) // Normalize array of addons (flatten)
    .filter(Boolean); // If addons is undef, filter is out

  return addons.map((addonName) => require(`./build/addons/webpack.${addonName}`));
};

module.exports = (env) => {
  const envConfig = require(`./build/webpack.${env.env}`);
  // Merge configs`
  let config = webpackMerge(commonConfig, envConfig, addons(env.addons));
  config.plugins = [
    new CopyPlugin([
      {from: 'src/assets/', to: 'assets/' },
    ]),
  ];
  // Return it
  return config;
};
