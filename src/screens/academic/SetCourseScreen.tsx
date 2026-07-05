import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';

const SetCourseScreen = () => {
  const Colors = useColors();
  const navigation = useNavigation();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: Colors.text, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text }}>Set Course</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 40 }}>📖</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 }}>Set Course</Text>
        <Text style={{ fontSize: 13, color: Colors.textMuted, marginTop: 6 }}>Coming Soon</Text>
      </View>
    </SafeAreaView>
  );
};
export default SetCourseScreen;