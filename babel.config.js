module.exports = function (api) {
  api.cache(true);

  const presets = [
    '@babel/preset-react',
    '@babel/preset-env',
  ];
  const plugins = [
    [ '@babel/plugin-proposal-decorators', { 'legacy': true }],
    '@babel/plugin-proposal-class-properties',
    [ '@babel/plugin-proposal-object-rest-spread', { 'legacy': true }],
    '@babel/transform-runtime',
  ];

  return {
    presets,
    plugins,
  };
};
