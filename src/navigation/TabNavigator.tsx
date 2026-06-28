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

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const MarketStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const BuzzStack = createNativeStackNavigator();
const SOSStack = createNativeStackNavigator();

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

// SOS Floating Button
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

export function TabNavigator() {
  const Colors = useColors();

  const TAB_ICONS: Record<string, { icon: string; label: string }> = {
    Home: { icon: '🏠', label: 'Home' },
    Marketplace: { icon: '🛍️', label: 'Market' },
    Buzz: { icon: '⚡', label: 'Buzz' },
    Chats: { icon: '💬', label: 'Chats' },
    Profile: { icon: '👤', label: 'Profile' },
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
              fontSize: 10,
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
              width: 44,
              height: 32,
              borderRadius: 12,
              backgroundColor: focused ? Colors.accent + '20' : 'transparent',
            }}>
              <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
                {TAB_ICONS[route.name]?.icon ?? '●'}
              </Text>
            </View>
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Marketplace" component={MarketplaceStack} />
        <Tab.Screen name="Buzz" component={BuzzStackScreen} />
        <Tab.Screen name="Chats" component={ChatsStack} />
        <Tab.Screen name="Profile" component={ProfileStackScreen} />
      </Tab.Navigator>

      {/* SOS Floating Button */}
      <SOSButton />
    </View>
  );
}