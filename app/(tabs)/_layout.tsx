import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.secondary, // Orange de NextMate
        tabBarInactiveTintColor: isDarkMode ? '#A1A1AA' : '#6B7280',
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: isDarkMode 
              ? 'rgba(88, 28, 135, 0.9)' 
              : 'rgba(248, 250, 252, 0.95)', // Gris clair translucide
            borderTopWidth: isDarkMode ? 0 : 1,
            borderTopColor: isDarkMode ? 'transparent' : '#D1D5DB',
          },
          default: {
            backgroundColor: isDarkMode 
              ? '#581C87' 
              : '#F8FAFC', // Gris clair en mode clair
            borderTopWidth: isDarkMode ? 0 : 1,
            borderTopColor: isDarkMode ? 'transparent' : '#D1D5DB',
            shadowColor: isDarkMode ? 'transparent' : '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: isDarkMode ? 0 : 0.1,
            shadowRadius: isDarkMode ? 0 : 4,
            elevation: isDarkMode ? 0 : 8,
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trouve1mate"
        options={{
          title: 'Trouver',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="search" size={24} color={color} />
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
