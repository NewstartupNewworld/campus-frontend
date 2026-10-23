import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../theme/ThemeProvider';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FEATURES: { id: string; icon: IconName; title: string; subtitle: string; screen: string; color: string; bg: string }[] = [
  {
    id: 'internships', icon: 'briefcase', title: 'Internships',
    subtitle: 'Find internship openings that fit your course and skills',
    screen: 'Internships', color: '#4F7CFF', bg: '#4F7CFF22',
  },
  {
    id: 'gigs', icon: 'cash', title: 'Gigs',
    subtitle: 'Earn from freelance and part-time work on campus',
    screen: 'Gigs', color: '#22C55E', bg: '#22C55E22',
  },
  {
    id: 'resume', icon: 'document-text', title: 'Resume AI',
    subtitle: 'Build and improve your resume with AI help',
    screen: 'ResumeAI', color: '#7C5CFF', bg: '#7C5CFF22',
  },
];

export default function CareerScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Career</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>Internships, gigs & resume help</Text>
        </View>

        {/* Feature cards */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
            EXPLORE
          </Text>
          {FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              onPress={() => navigation.navigate(feature.screen)}
              activeOpacity={0.75}
              style={{ backgroundColor: colors.card, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}
            >
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: feature.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={feature.icon} size={24} color={feature.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 3 }}>{feature.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>{feature.subtitle}</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: feature.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={16} color={feature.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}