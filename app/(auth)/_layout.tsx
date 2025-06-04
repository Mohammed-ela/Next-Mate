import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen 
          name="login" 
          options={{
            title: 'Login',
          }}
        />
        <Stack.Screen 
          name="register" 
          options={{
            title: 'Register',
          }}
        />
        <Stack.Screen 
          name="forgot-password" 
          options={{
            title: 'Forgot Password',
          }}
        />
      </Stack>
    </>
  );
} 