import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

interface LoginWithGoogleButtonProps {
  onSuccess?: () => void;
  style?: any;
}

export const LoginWithGoogleButton: React.FC<LoginWithGoogleButtonProps> = ({ 
  onSuccess, 
  style 
}) => {
  const { signInWithGoogle, isLoading, error } = useGoogleAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err) {
      Alert.alert(
        'Erreur de connexion',
        'Impossible de se connecter avec Google. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  // Afficher l'erreur si nécessaire
  React.useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error, [{ text: 'OK' }]);
    }
  }, [error]);

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleGoogleLogin}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <Ionicons name="logo-google" size={20} color="#4285F4" />
        )}
        <Text style={styles.buttonText}>
          {isLoading ? 'Connexion...' : 'Continuer avec Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '600',
  },
}); 