import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../../theme/ThemeProvider';

const FEATURES = [
  {
    id: 'internships', icon: '💼', title: 'Internships',
    subtitle: 'Find internships matched to your skills and college',
    screen: 'Internships', color: '#4F7CFF', bg: '#4F7CFF22',
  },
  {
    id: 'gigs', icon: '⚡', title: 'Freelance Gigs',
    subtitle: 'Find short-term gigs and earn while you study',
    screen: 'Gigs', color: '#F97316', bg: '#F9731622',
  },
  {
    id: 'resume', icon: '📄', title: 'Resume AI',
    subtitle: 'Get AI feedback on your resume instantly',
    screen: 'ResumeAI', color: '#22C55E', bg: '#22C55E22',
  },
];

const QUICK_TIPS = [
  '💼 Update your profile to get better matches',
  '⚡ Gigs are a great way to build your portfolio',
  '📄 A good resume can get you 3x more interviews',
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
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Career Hub 🚀</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>Internships, gigs & resume help</Text>
        </View>

        {/* Quick tip banner */}
        <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: '#4F7CFF15', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#4F7CFF' }}>
          <Text style={{ color: '#4F7CFF', fontSize: 13, fontWeight: '600', marginBottom: 6 }}>💡 Quick Tips</Text>
          {QUICK_TIPS.map((tip, i) => (
            <Text key={i} style={{ color: colors.textMuted, fontSize: 12, lineHeight: 20 }}>{tip}</Text>
          ))}
        </View>

        {/* Feature cards */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>
            FEATURES
          </Text>
          {FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              onPress={() => navigation.navigate(feature.screen)}
              activeOpacity={0.75}
              style={{ backgroundColor: colors.card, borderRadius: 18, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}
            >
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: feature.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 24 }}>{feature.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600', marginBottom: 3 }}>{feature.title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}>{feature.subtitle}</Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: feature.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: feature.color, fontSize: 16 }}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming soon banner */}
        <View style={{ marginHorizontal: 20, marginTop: 24, backgroundColor: colors.card, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 }}>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 }}>🔜 Coming Soon</Text>
          {[
            '🏆 Alumni Mentorship Network',
            '🤖 AI Mock Interviews',
            '🎯 Skill Badges & Certificates',
            '📊 Salary Insights by College',
          ].map((item, i) => (
            <Text key={i} style={{ color: colors.textMuted, fontSize: 13, lineHeight: 22 }}>{item}</Text>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}