import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#F97316', // Orange de NextMate
        tabBarInactiveTintColor: '#A1A1AA',
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'rgba(107, 70, 193, 0.9)', // Purple translucide
          },
          default: {
            backgroundColor: '#6B46C1', // Purple de NextMate
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trouve1mate"
        options={{
          title: 'T1M',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="people" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
