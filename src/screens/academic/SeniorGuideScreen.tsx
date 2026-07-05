import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';

const SeniorGuideScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.text, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text }}>Senior Guide</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 40 }}>👴</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 }}>Senior Guide</Text>
        <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 6 }}>Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
};
export default SeniorGuideScreen;