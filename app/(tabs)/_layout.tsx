import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';
import { NotificationBadge } from '../../components/NotificationBadge';
import { useConversations } from '../../context/ConversationsContext';
import { useBadgeNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { isDarkMode, colors } = useTheme();
  const { totalUnreadCount } = useBadgeNotifications();
  const { conversations } = useConversations();
  
  // 📊 Calcul du nombre de conversations avec messages non lus
  const realTimeUnreadCount = conversations.filter(conversation => {
    return (conversation.unreadCount || 0) > 0;
  }).length;
  
  // Debug désactivé pour réduire le spam console
  // console.log('📊 Unread count toolbar:', realTimeUnreadCount, 'conversations:', conversations.length);
  
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
        name="ai-matching"
        options={{
          title: 'IA Premium',
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={{
              position: 'relative',
              transform: [{ translateY: -8 }], // Remonter l'icône
              shadowColor: focused ? '#8B5CF6' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: focused ? 8 : 0,
            }}>
              <LinearGradient
                colors={focused ? 
                  ['#8B5CF6', '#FF8E53'] : 
                  [isDarkMode ? '#6B7280' : '#9CA3AF', isDarkMode ? '#6B7280' : '#9CA3AF']
                }
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 3,
                  borderColor: focused ? '#FFFFFF' : 'transparent',
                }}
              >
                <Ionicons 
                  name="construct" 
                  size={28} 
                  color={focused ? '#FFFFFF' : color} 
                />
                {/* Badge Premium */}
                <View style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: '#FFD700',
                  borderRadius: 8,
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                }}>
                  <Text style={{
                    color: '#000',
                    fontSize: 8,
                    fontWeight: 'bold',
                  }}>AI</Text>
                </View>
              </LinearGradient>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color }: { color: string }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="chatbubbles" size={24} color={color} />
              <NotificationBadge
                count={realTimeUnreadCount}
                isVisible={realTimeUnreadCount > 0}
                type="message"
                size="small"
                position="topRight"
              />
            </View>
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
