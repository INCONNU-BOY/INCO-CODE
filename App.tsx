// App.tsx
// INCO CODE 

import React, { useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import SplashScreen  from './app/screens/SplashScreen';
import AppNavigator  from './app/navigation';

LogBox.ignoreLogs([
  'ViewPropTypes',
  'Non-serializable values',
  'Require cycle',
]);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />

      {showSplash ? (
        <SplashScreen onFinished={() => setShowSplash(false)} />
      ) : (
        <AppNavigator />
      )}

      {/* Notifications toast globales */}
      <Toast
        config={{
          success: (props: any) => null, // on utilise Alert.alert à la place
        }}
      />
    </GestureHandlerRootView>
  );
}

