module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }],
    ],
    plugins: [
      // Plugin pour React Native Reanimated
      'react-native-reanimated/plugin',
    ],
    env: {
      test: {
        presets: [
          ['babel-preset-expo', { jsxImportSource: 'react' }],
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
        plugins: [
          '@babel/plugin-transform-react-jsx',
        ],
      },
    },
  };
}; 