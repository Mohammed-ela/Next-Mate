import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

// 🛡️ Types pour le HOC
interface WithAuthGuardOptions {
  redirectTo?: string;
  loadingComponent?: React.ComponentType;
  unauthorizedComponent?: React.ComponentType;
}

// 🔒 Higher-Order Component pour protéger les écrans
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthGuardOptions = {}
) {
  const {
    redirectTo = '/(auth)/login',
    loadingComponent: LoadingComponent,
    unauthorizedComponent: UnauthorizedComponent,
  } = options;

  const AuthGuardedComponent: React.FC<P> = (props) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    // ⏳ État de chargement
    if (loading) {
      if (LoadingComponent) {
        return <LoadingComponent />;
      }
      return (
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      );
    }

    // 🚫 Utilisateur non connecté
    if (!user) {
      if (UnauthorizedComponent) {
        return <UnauthorizedComponent />;
      }
      
      // Redirection automatique
      router.replace(redirectTo as any);
      return (
        <View style={styles.container}>
          <Text style={styles.redirectText}>Redirection...</Text>
        </View>
      );
    }

    // ✅ Utilisateur connecté - afficher le composant protégé
    return <WrappedComponent {...props} />;
  };

  // 🏷️ Nom du composant pour le debug
  AuthGuardedComponent.displayName = `withAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthGuardedComponent;
}

// 🎨 Styles par défaut
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F0C4D',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  redirectText: {
    color: '#FFFFFF80',
    fontSize: 14,
  },
});

// 🔧 Hook utilitaire pour vérifier l'auth dans les composants
export const useRequireAuth = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading, router]);

  return { user, loading, isAuthenticated: !!user };
}; 