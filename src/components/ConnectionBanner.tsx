import React, { useEffect, useState } from 'react';
import { DeviceEventEmitter, StatusBar, Text, View } from 'react-native';

type NetState = 'ok' | 'waking' | 'offline';

/** A strip at the top of the screen when the server is waking up or the phone has no connection. */
export default function ConnectionBanner() {
  const [state, setState] = useState<NetState>('ok');

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('net:status', (s: NetState) => setState(s));
    return () => sub.remove();
  }, []);

  if (state === 'ok') return null;
  const waking = state === 'waking';
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, elevation: 9999,
        paddingTop: (StatusBar.currentHeight ?? 24) + 6, paddingBottom: 8, paddingHorizontal: 16,
        backgroundColor: waking ? '#B45309' : '#B91C1C',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700', textAlign: 'center' }}>
        {waking ? 'Server is waking up. This can take up to a minute.' : 'No connection. Check your internet. We will keep trying.'}
      </Text>
    </View>
  );
}
// END OF FILE