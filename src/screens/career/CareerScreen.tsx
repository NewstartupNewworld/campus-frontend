import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';

const CareerScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: Colors.text }}>🚀 Career</Text>
        <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Internships, gigs & more</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 40 }}>🚀</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 }}>Career Hub</Text>
        <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 6 }}>Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
};
export default CareerScreen;