import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { SavedDataProvider } from '../context/SavedDataContext';
import { JourneyProvider } from '../context/JourneyContext';
import { AuthProvider } from '../context/AuthContext';

const RNView = View as any;
const RNStatusBar = StatusBar as any;

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider style={styles.container}>
      <RNStatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AuthProvider>
        <SavedDataProvider>
          <JourneyProvider>
            <RNView style={styles.container}>
              <Slot />
            </RNView>
          </JourneyProvider>
        </SavedDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
