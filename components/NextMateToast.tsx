import { Colors } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';

// 🎨 Configuration Toast personnalisée NextMate
export const toastConfig = {
  // Toast de succès
  success: (props: any) => (
    <BaseToast
      {...props}
      style={styles.successToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Text style={styles.successIcon}>✅</Text>
        </View>
      )}
    />
  ),

  // Toast d'erreur
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={styles.errorToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Text style={styles.errorIcon}>❌</Text>
        </View>
      )}
    />
  ),

  // Toast d'info
  info: (props: any) => (
    <InfoToast
      {...props}
      style={styles.infoToast}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <View style={styles.iconContainer}>
          <Text style={styles.infoIcon}>ℹ️</Text>
        </View>
      )}
    />
  ),

  // Toast de chargement
  loading: (props: any) => (
    <View style={styles.loadingToast}>
      <View style={styles.iconContainer}>
        <Text style={styles.loadingIcon}>⏳</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text1}>{props.text1}</Text>
        {props.text2 && <Text style={styles.text2}>{props.text2}</Text>}
      </View>
    </View>
  ),

  // Toast d'upload
  upload: (props: any) => (
    <View style={styles.uploadToast}>
      <View style={styles.iconContainer}>
        <Text style={styles.uploadIcon}>📤</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.text1}>{props.text1}</Text>
        {props.text2 && <Text style={styles.text2}>{props.text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  // Toast de succès - Style NextMate
  successToast: {
    borderLeftColor: '#FF8E53',
    borderLeftWidth: 4,
    backgroundColor: 'rgba(47, 12, 77, 0.95)',
    borderRadius: 16,
    marginHorizontal: 16,
    elevation: 8,
    shadowColor: '#FF8E53',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 83, 0.3)',
  },

  // Toast d'erreur
  errorToast: {
    borderLeftColor: '#F44336',
    borderLeftWidth: 4,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Toast d'info
  infoToast: {
    borderLeftColor: Colors.light.tint,
    borderLeftWidth: 4,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    marginHorizontal: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Toast de chargement
  loadingToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
    borderLeftColor: '#FF9800',
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Toast d'upload - Style NextMate
  uploadToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(88, 28, 135, 0.95)',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    borderLeftColor: '#FF8E53',
    borderLeftWidth: 4,
    elevation: 8,
    shadowColor: '#581C87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 142, 83, 0.3)',
  },

  // Conteneurs
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 142, 83, 0.2)',
  },

  textContainer: {
    flex: 1,
  },

  // Textes - Style NextMate
  text1: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },

  text2: {
    fontSize: 14,
    color: '#FFFFFF80',
    lineHeight: 18,
  },

  // Icônes
  successIcon: {
    fontSize: 18,
  },

  errorIcon: {
    fontSize: 18,
  },

  infoIcon: {
    fontSize: 18,
  },

  loadingIcon: {
    fontSize: 18,
  },

  uploadIcon: {
    fontSize: 18,
  },
});

export default toastConfig; 