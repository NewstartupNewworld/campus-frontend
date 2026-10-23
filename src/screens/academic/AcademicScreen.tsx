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
    id: 'notes', icon: 'document-text', title: 'Notes Generator',
    subtitle: 'Generate structured notes on any topic instantly',
    screen: 'Notes', color: '#4F7CFF', bg: '#4F7CFF22',
  },
  {
    id: 'doubt', icon: 'help-circle', title: 'Doubt Solver',
    subtitle: 'Ask any academic question, get clear explanations',
    screen: 'Doubt', color: '#22C55E', bg: '#22C55E22',
  },
  {
    id: 'planner', icon: 'calendar', title: 'Study Planner',
    subtitle: 'Get a personalized day-by-day exam prep plan',
    screen: 'StudyPlanner', color: '#F97316', bg: '#F9731622',
  },
  {
    id: 'pyq', icon: 'stats-chart', title: 'PYQ Analyzer',
    subtitle: 'Paste previous year questions, get pattern insights',
    screen: 'PYQ', color: '#7C5CFF', bg: '#7C5CFF22',
  },
  {
    id: 'senior', icon: 'school', title: 'Senior Guide',
    subtitle: 'Connect with seniors for mentorship and advice',
    screen: 'SeniorGuide', color: '#EF4444', bg: '#EF444422',
  },
];

const QUICK_TIPS: { icon: IconName; text: string }[] = [
  { icon: 'flash-outline', text: 'Use Notes Generator for last-minute revision' },
  { icon: 'locate-outline', text: 'Doubt Solver works best with specific questions' },
  { icon: 'calendar-outline', text: 'Set your exam date in Study Planner for best results' },
];

export default function AcademicScreen() {
  const colors = useColors();
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>Academic AI</Text>
          <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4 }}>Your AI-powered study companion</Text>
        </View>

        {/* Quick tip banner */}
        <View style={{ marginHorizontal: 20, marginBottom: 24, backgroundColor: '#4F7CFF15', borderRadius: 14, padding: 14, borderLeftWidth: 3, borderLeftColor: '#4F7CFF' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Ionicons name="bulb-outline" size={15} color="#4F7CFF" />
            <Text style={{ color: '#4F7CFF', fontSize: 13, fontWeight: '600' }}>Quick Tips</Text>
          </View>
          {QUICK_TIPS.map((tip, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name={tip.icon} size={14} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 20, flex: 1 }}>{tip.text}</Text>
            </View>
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

        <Text style={{ color: colors.textDim, fontSize: 11, textAlign: 'center', marginTop: 28, paddingHorizontal: 40, lineHeight: 16 }}>
          Powered by Groq AI (Llama 3.3) · Results may vary · Always verify important information
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}