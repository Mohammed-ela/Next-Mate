import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6B46C1', '#9333EA', '#A855F7']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>NextMate</Text>
          <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
  },
}); 