import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Colors } from '../theme/colors';
import { MarketplaceScreen } from '../screens/marketplace/MarketplaceScreen';
import { ListingDetailScreen } from '../screens/marketplace/ListingDetailScreen';
import { CreateListingScreen } from '../screens/marketplace/CreateListingScreen';
import { ChatRoomScreen } from '../screens/chat/ChatRoomScreen';
import { ChatsListScreen } from '../screens/chat/ChatsListScreen';
import { BuzzTabScreen } from '../screens/buzz/BuzzTabScreen';
import { SOSScreen } from '../screens/sos/SOSScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const MarketStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();

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

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ focused }) => {
          const icons: Record<string, string> = {
            Marketplace: '🛍️',
            Buzz: '⚡',
            Chats: '💬',
            SOS: '🚨',
            Profile: '👤',
          };
          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.35 }}>
              {icons[route.name] ?? '●'}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen name="Marketplace" component={MarketplaceStack} />
      <Tab.Screen name="Buzz" component={BuzzTabScreen} />
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen name="SOS" component={SOSScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
