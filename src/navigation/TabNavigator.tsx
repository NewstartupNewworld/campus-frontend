import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, TouchableOpacity, Keyboard } from 'react-native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../theme/ThemeProvider';
import FloatingSOS from '../components/FloatingSOS';
import { HomeScreen } from '../screens/home/HomeScreen';
import * as CampusChatModule from '../screens/home/CampusChatScreen';
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
import VerificationScreen from '../screens/profile/VerificationScreen';

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

// Lost & Found screens
import LostFoundScreen from '../screens/lostfound/LostFoundScreen';
import CreateLostFoundScreen from '../screens/lostfound/CreateLostFoundScreen';

// Confessions screens
import ConfessionsScreen from '../screens/confessions/ConfessionsScreen';
import CreateConfessionScreen from '../screens/confessions/CreateConfessionScreen';

// Roommate screens
import RoommateScreen from '../screens/roommate/RoommateScreen';
import CreateRoommateScreen from '../screens/roommate/CreateRoommateScreen';

// Clubs screens
import ClubsScreen from '../screens/clubs/ClubsScreen';
import ClubDetailScreen from '../screens/clubs/ClubDetailScreen';
import CreateClubScreen from '../screens/clubs/CreateClubScreen';

// CampusChat may be a named or a default export, so support both
const CampusChatScreen: any =
  (CampusChatModule as any).CampusChatScreen ?? (CampusChatModule as any).default;

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
const LostFoundStack = createNativeStackNavigator();
const ConfessionsStack = createNativeStackNavigator();
const RoommateStack = createNativeStackNavigator();
const ClubsStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      {CampusChatScreen ? (
        <HomeStack.Screen name="CampusChat" component={CampusChatScreen} />
      ) : null}
    </HomeStack.Navigator>
  );
}

// Market also hosts Roommates and Lost & Found, so their create screens live here
function MarketplaceStack() {
  return (
    <MarketStack.Navigator screenOptions={{ headerShown: false }}>
      <MarketStack.Screen name="Feed" component={MarketplaceScreen} />
      <MarketStack.Screen name="ListingDetail" component={ListingDetailScreen} />
      <MarketStack.Screen name="CreateListing" component={CreateListingScreen} />
      <MarketStack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <MarketStack.Screen name="CreateRoommate" component={CreateRoommateScreen} />
      <MarketStack.Screen name="CreateLostFound" component={CreateLostFoundScreen} />
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
      <ProfileStack.Screen name="Verification" component={VerificationScreen} />
    </ProfileStack.Navigator>
  );
}

// Buzz also hosts Events, Clubs and Confessions, so their detail/create screens live here
function BuzzStackScreen() {
  return (
    <BuzzStack.Navigator screenOptions={{ headerShown: false }}>
      <BuzzStack.Screen name="BuzzMain" component={BuzzTabScreen} />
      <BuzzStack.Screen name="GroupChat" component={GroupChatScreen} />
      <BuzzStack.Screen name="EventDetail" component={EventDetailScreen} />
      <BuzzStack.Screen name="CreateEvent" component={CreateEventScreen} />
      <BuzzStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <BuzzStack.Screen name="CreateClub" component={CreateClubScreen} />
      <BuzzStack.Screen name="CreateConfession" component={CreateConfessionScreen} />
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

function EventsStackScreen() {
  return (
    <EventsStack.Navigator screenOptions={{ headerShown: false }}>
      <EventsStack.Screen name="EventsMain" component={EventsScreen} />
      <EventsStack.Screen name="EventDetail" component={EventDetailScreen} />
      <EventsStack.Screen name="CreateEvent" component={CreateEventScreen} />
    </EventsStack.Navigator>
  );
}

function LostFoundStackScreen() {
  return (
    <LostFoundStack.Navigator screenOptions={{ headerShown: false }}>
      <LostFoundStack.Screen name="LostFoundMain" component={LostFoundScreen} />
      <LostFoundStack.Screen name="CreateLostFound" component={CreateLostFoundScreen} />
    </LostFoundStack.Navigator>
  );
}

function ConfessionsStackScreen() {
  return (
    <ConfessionsStack.Navigator screenOptions={{ headerShown: false }}>
      <ConfessionsStack.Screen name="ConfessionsMain" component={ConfessionsScreen} />
      <ConfessionsStack.Screen name="CreateConfession" component={CreateConfessionScreen} />
    </ConfessionsStack.Navigator>
  );
}

function RoommateStackScreen() {
  return (
    <RoommateStack.Navigator screenOptions={{ headerShown: false }}>
      <RoommateStack.Screen name="RoommateMain" component={RoommateScreen} />
      <RoommateStack.Screen name="CreateRoommate" component={CreateRoommateScreen} />
    </RoommateStack.Navigator>
  );
}

function ClubsStackScreen() {
  return (
    <ClubsStack.Navigator screenOptions={{ headerShown: false }}>
      <ClubsStack.Screen name="ClubsMain" component={ClubsScreen} />
      <ClubsStack.Screen name="ClubDetail" component={ClubDetailScreen} />
      <ClubsStack.Screen name="CreateClub" component={CreateClubScreen} />
    </ClubsStack.Navigator>
  );
}

// ---------- Tab bar (4 tabs) ----------
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_BAR_HEIGHT = 58;

const VISIBLE_TABS: { name: string; label: string; icon: IconName; iconOff: IconName }[] = [
  { name: 'Home', label: 'Home', icon: 'home', iconOff: 'home-outline' },
  { name: 'Marketplace', label: 'Market', icon: 'storefront', iconOff: 'storefront-outline' },
  { name: 'Buzz', label: 'Buzz', icon: 'flash', iconOff: 'flash-outline' },
  { name: 'Profile', label: 'Profile', icon: 'person', iconOff: 'person-outline' },
];

// Which visible tab lights up for each (hidden) screen
const ACTIVE_TAB_FOR: Record<string, string> = {
  Home: 'Home', Academic: 'Home', Career: 'Home',
  Marketplace: 'Marketplace', Roommate: 'Marketplace', LostFound: 'Marketplace', Chats: 'Marketplace',
  Buzz: 'Buzz', Events: 'Buzz', Clubs: 'Buzz', Confessions: 'Buzz',
  Profile: 'Profile',
};

// Screens with a message box at the bottom: the SOS button collapses to a side handle there
const CHAT_SCREENS = ['CampusChat', 'ChatRoom', 'GroupChat'];

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

function CustomTabBar({
  state,
  navigation,
  onRouteChange,
}: BottomTabBarProps & { onRouteChange: (tab: string, deep: string) => void }) {
  const Colors = useColors();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  const currentRoute = state.routes[state.index];
  const current = currentRoute?.name ?? 'Home';
  const deep = (currentRoute ? getFocusedRouteNameFromRoute(currentRoute as any) : undefined) ?? '';
  const activeKey = ACTIVE_TAB_FOR[current] ?? '';
  const bottomPad = Math.max(insets.bottom, 8);

  useEffect(() => {
    onRouteChange(current, deep);
  }, [current, deep]);

  if (keyboardVisible) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: TAB_BAR_HEIGHT + bottomPad,
        paddingBottom: bottomPad,
        paddingTop: 6,
      }}
    >
      {VISIBLE_TABS.map((tab) => {
        const focused = activeKey === tab.name;
        const route = state.routes.find((r) => r.name === tab.name);

        const onPress = () => {
          if (!route) return;
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (current !== tab.name && !event.defaultPrevented) {
            navigation.navigate(tab.name as never);
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            <View
              style={{
                width: 56,
                height: 30,
                borderRadius: 15,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? Colors.accent + '2E' : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? tab.icon : tab.iconOff}
                size={22}
                color={focused ? Colors.accent : Colors.textMuted}
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                marginTop: 2,
                fontWeight: focused ? '700' : '500',
                color: focused ? Colors.accent : Colors.textMuted,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------- Tab navigator ----------
export function TabNavigator() {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();
  const [focus, setFocus] = useState({ tab: 'Home', deep: '' });

  const tabBarTotal = TAB_BAR_HEIGHT + Math.max(insets.bottom, 8);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        initialRouteName="Home"
        backBehavior="history"
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <CustomTabBar {...props} onRouteChange={(tab, deep) => setFocus({ tab, deep })} />
        )}
      >
        {/* Visible tabs */}
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceStack} />
        <Tab.Screen name="Buzz" component={BuzzStackScreen} />
        <Tab.Screen name="Profile" component={ProfileStackScreen} />

        {/* Reached from inside the app (not shown in the tab bar) */}
        <Tab.Screen name="Academic" component={AcademicStackScreen} />
        <Tab.Screen name="Career" component={CareerStackScreen} />
        <Tab.Screen name="Chats" component={ChatsStack} />
        <Tab.Screen name="Events" component={EventsStackScreen} />
        <Tab.Screen name="Clubs" component={ClubsStackScreen} />
        <Tab.Screen name="Confessions" component={ConfessionsStackScreen} />
        <Tab.Screen name="LostFound" component={LostFoundStackScreen} />
        <Tab.Screen name="Roommate" component={RoommateStackScreen} />
        <Tab.Screen name="SOS" component={SOSStackScreen} />
      </Tab.Navigator>

      <FloatingSOS
        tabBarHeight={tabBarTotal}
        enabled={!keyboardVisible && focus.tab !== 'SOS'}
        chatContext={CHAT_SCREENS.includes(focus.deep)}
      />
    </View>
  );
}