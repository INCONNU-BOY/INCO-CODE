// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 */
const config = {
  resolver: {
    // Support des extensions supplémentaires
    sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs', 'mjs'],
    assetExts: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ttf', 'otf', 'woff', 'woff2'],
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

