import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { reportError } from '../utils/errorReporter';

type Props = { children: React.ReactNode };
type State = { failed: boolean; message: string };

// Sits above the whole app, so it uses fixed colours (the app's theme may be what broke)
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { failed: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    const firstLine = String(info?.componentStack ?? '').trim().split('\n')[0] ?? '';
    reportError(error, `screen ${firstLine}`);
  }

  reset = () => this.setState({ failed: false, message: '' });

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F1A', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Text style={{ fontSize: 44, color: '#94A3B8', marginBottom: 10 }}>:(</Text>
        <Text style={{ color: '#F1F5F9', fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>
          Something went wrong
        </Text>
        <Text style={{ color: '#94A3B8', fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 22 }}>
          This screen had a problem. We have noted it. Please try again.
        </Text>
        <TouchableOpacity
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={{ minHeight: 48, borderRadius: 24, backgroundColor: '#2F54EB', paddingHorizontal: 30, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Try again</Text>
        </TouchableOpacity>
        <Text style={{ color: '#475569', fontSize: 11, marginTop: 24, textAlign: 'center' }} numberOfLines={3}>
          {this.state.message}
        </Text>
      </View>
    );
  }
}
// END OF FILE