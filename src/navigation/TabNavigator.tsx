import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColors } from '../theme/ThemeProvider';
import { HomeScreen } from '../screens/home/HomeScreen';
import { MarketplaceScreen } from '../screens/marketplace/MarketplaceScreen';
import { ListingDetailScreen } from '../screens/marketplace/ListingDetailScreen';
import { CreateListingScreen } from '../screens/marketplace/CreateListingScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { ChatsListScreen } from '../screens/chat/ChatsListScreen';
import { BuzzTabScreen } from '../screens/buzz/BuzzTabScreen';
import { GroupChatScreen } from '../screens/buzz/GroupChatScreen';
import { SOSScreen } from '../screens/sos/SOSScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { CollegeAccessScreen } from '../screens/profile/CollegeAccessScreen';
import { NotificationsScreen } from '../screens/profile/NotificationsScreen';

// Academic screens
import AcademicScreen from '../screens/academic/AcademicScreen';
import NotesScreen from '../screens/academic/NotesScreen';
import DoubtScreen from '../screens/academic/DoubtScreen';
import StudyPlannerScreen from '../screens/academic/StudyPlannerScreen';
import PYQScreen from '../screens/academic/PYQScreen';
import SeniorGuideScreen from '../screens/academic/SeniorGuideScreen';
import SetCourseScreen from '../screens/academic/SetCourseScreen';

// Career screens
import CareerScreen from '../screens/career/CareerScreen';
import InternshipsScreen from '../screens/career/InternshipsScreen';
import GigsScreen from '../screens/career/GigsScreen';
import ResumeAIScreen from '../screens/career/ResumeAIScreen';

// Events screens
import EventsScreen from '../screens/events/EventsScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const BuzzStack = createNativeStackNavigator();
const SOSStack = createNativeStackNavigator();
const AcademicStack = createNativeStackNavigator();
const CareerStack = createNativeStackNavigator();
const EventsStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
    </HomeStack.Navigator>
  );
}

function MarketplaceStack() {
  return (
    <MarketStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketStack.Screen name="Feed" component={MarketplaceScreen} />
      <MarketStack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <MarketStack.Screen name="CreateListing" component={CreateListingScreen} />
      <MarketStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </MarketStack.Navigator>
  );
}

function ChatsStack() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ChatsList" component={ChatsListScreen} />
      <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} />
    </ChatStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="CollegeAccess" component={CollegeAccessScreen} />
      <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

function BuzzStackScreen() {
  return (
    <BuzzStack.Navigator screenOptions={{ headerShown: false }}>
      <BuzzStack.Screen name="BuzzMain" component={BuzzTabScreen} />
      <BuzzStack.Screen name="GroupChat" component={GroupChatScreen} />
    </BuzzStack.Navigator>
  );
}

function SOSStackScreen() {
  return (
    <SOSStack.Navigator screenOptions={{ headerShown: false }}>
      <SOSStack.Screen name="SOSMain" component={SOSScreen} />
    </SOSStack.Navigator>
  );
}

// ─── ACADEMIC STACK ───────────────────────────────────────────────────────────
function AcademicStackScreen() {
  return (
    <AcademicStack.Navigator screenOptions={{ headerShown: false }}>
      <AcademicStack.Screen name="AcademicMain" component={AcademicScreen} />
      <AcademicStack.Screen name="Notes" component={NotesScreen} />
      <AcademicStack.Screen name="Doubt" component={DoubtScreen} />
      <AcademicStack.Screen name="StudyPlanner" component={StudyPlannerScreen} />
      <AcademicStack.Screen name="PYQ" component={PYQScreen} />
      <AcademicStack.Screen name="SeniorGuide" component={SeniorGuideScreen} />
      <AcademicStack.Screen name="SetCourse" component={SetCourseScreen} />
    </AcademicStack.Navigator>
  );
}

// ─── CAREER STACK ─────────────────────────────────────────────────────────────
function CareerStackScreen() {
  return (
    <CareerStack.Navigator screenOptions={{ headerShown: false }}>
      <CareerStack.Screen name="CareerMain" component={CareerScreen} />
      <CareerStack.Screen name="Internships" component={InternshipsScreen} />
      <CareerStack.Screen name="Gigs" component={GigsScreen} />
      <CareerStack.Screen name="ResumeAI" component={ResumeAIScreen} />
    </CareerStack.Navigator>
  );
}

// ─── EVENTS STACK ─────────────────────────────────────────────────────────────
function EventsStackScreen() {
  return (
    <EventsStack.Navigator screenOptions={{ headerShown: false }}>
      <EventsStack.Screen name="EventsMain" component={EventsScreen} />
      <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
      <EventsStack.Screen name="CreateEvent" component={CreateEventScreen} />
    </EventsStack.Navigator>
  );
}

// ─── SOS FLOATING BUTTON ─────────────────────────────────────────────────────
const SOSButton = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={sos.btn}
      onPress={() => (navigation as any).navigate('SOSTab')}
      activeOpacity={0.85}
    >
      <Text style={sos.icon}>🚨</Text>
    </TouchableOpacity>
  );
};

const sos = StyleSheet.create({
  btn: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  icon: { fontSize: 24 },
});

// ─── TAB NAVIGATOR ────────────────────────────────────────────────────────────
export function TabNavigator() {
  const Colors = useColors();

  const TAB_ICONS: Record<string, { icon: string; label: string }> = {
    Home:        { icon: '🏠', label: 'Home' },
    Marketplace: { icon: '🛍️', label: 'Market' },
    Buzz:        { icon: '⚡', label: 'Buzz' },
    Academic:    { icon: '🎓', label: 'Study' },
    Career:      { icon: '🚀', label: 'Career' },
    Events:      { icon: '📅', label: 'Events' },
    Chats:       { icon: '💬', label: 'Chats' },
    Profile:     { icon: '👤', label: 'Profile' },
  };

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: Colors.card,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            height: 90,
            paddingBottom: 28,
            paddingTop: 6,
          },
          tabBarActiveTintColor: Colors.accent,
          tabBarInactiveTintColor: Colors.textDim,
          tabBarLabel: ({ focused }) => (
            <Text style={{
              fontSize: 9,
              fontWeight: '700',
              color: focused ? Colors.accent : Colors.textDim,
              marginTop: 2,
            }}>
              {TAB_ICONS[route.name]?.label ?? route.name}
            </Text>
          ),
          tabBarIcon: ({ focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 28,
              borderRadius: 8,
              backgroundColor: focused ? Colors.accent + '20' : 'transparent',
            }}>
              <Text style={{ fontSize: 16, opacity: focused ? 1 : 0.4 }}>
                {TAB_ICONS[route.name]?.icon ?? '●'}
              </Text>
            </View>
          ),
        })}
      >
        <Tab.Screen name="Home"        component={HomeStackScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceStack} />
        <Tab.Screen name="Buzz"        component={BuzzStackScreen} />
        <Tab.Screen name="Academic"    component={AcademicStackScreen} />
        <Tab.Screen name="Career"      component={CareerStackScreen} />
        <Tab.Screen name="Events"      component={EventsStackScreen} />
        <Tab.Screen name="Chats"       component={ChatsStack} />
        <Tab.Screen name="Profile"     component={ProfileStackScreen} />
      </Tab.Navigator>

      {/* SOS Floating Button */}
      <SOSButton />
    </View>
  );
}