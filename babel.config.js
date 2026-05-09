module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['./app'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './app',
          '@components': './app/components',
          '@screens': './app/screens',
          '@utils': './app/utils',
          '@storage': './app/storage',
          '@themes': './app/themes',
          '@assets': './app/assets',
        },
      },
    ],
  ],
};

