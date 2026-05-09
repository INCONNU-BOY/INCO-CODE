// app/navigation/index.tsx
// INCO CODE

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen     from '../screens/HomeScreen';
import EditorScreen   from '../screens/EditorScreen';
import PreviewScreen  from '../screens/PreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TerminalScreen from '../screens/TerminalScreen';

// ===========================
// TYPES DE NAVIGATION
// ===========================

export type RootStackParamList = {
  Home:     undefined;
  Editor:   undefined;
  Preview:  undefined;
  Settings: undefined;
  Terminal: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ===========================
// NAVIGATEUR PRINCIPAL
// ===========================

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,        
          animation: 'slide_from_right',
          gestureEnabled: true,
          contentStyle: { backgroundColor: '#0D1117' },
        }}
      >
        <Stack.Screen name="Home"     component={HomeScreen}     />
        <Stack.Screen name="Editor"   component={EditorScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="Preview"  component={PreviewScreen}  />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Terminal" component={TerminalScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
