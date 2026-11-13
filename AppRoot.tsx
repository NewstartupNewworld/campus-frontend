import React from 'react';
import { View } from 'react-native';
import App from './App';
import ErrorBoundary from './src/components/ErrorBoundary';
import ConnectionBanner from './src/components/ConnectionBanner';
import { installGlobalHandlers } from './src/utils/errorReporter';

installGlobalHandlers();

export default function AppRoot() {
  return (
    <ErrorBoundary>
      <View style={{ flex: 1 }}>
        <App />
        <ConnectionBanner />
      </View>
    </ErrorBoundary>
  );
}
// END OF FILE