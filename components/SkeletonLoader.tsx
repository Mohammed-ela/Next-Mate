import React from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonLoaderProps {
  style?: ViewStyle;
  width?: number | `${number}%` | 'auto';
  height?: number | `${number}%` | 'auto';
  borderRadius?: number;
  marginBottom?: number;
}

// Hook pour animation skeleton
const useSkeletonAnimation = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  return animatedValue;
};

// Composant skeleton de base
export const SkeletonBox: React.FC<SkeletonLoaderProps> = ({
  style,
  width = '100%',
  height = 20,
  borderRadius = 8,
  marginBottom = 0,
}) => {
  const { colors } = useTheme();
  const animatedValue = useSkeletonAnimation();

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: colors.border,
          borderRadius,
          marginBottom,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor: colors.border,
            borderRadius,
            opacity,
          },
        ]}
      />
    </View>
  );
};

// Skeleton pour profil utilisateur
export const UserProfileSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={{ 
      padding: 16, 
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 16 
    }}>
      {/* Avatar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <SkeletonBox width={60} height={60} borderRadius={30} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <SkeletonBox width="60%" height={20} marginBottom={8} />
          <SkeletonBox width="40%" height={16} />
        </View>
      </View>

      {/* Bio */}
      <SkeletonBox width="100%" height={16} marginBottom={8} />
      <SkeletonBox width="80%" height={16} marginBottom={16} />

      {/* Tags jeux */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <SkeletonBox width={80} height={32} borderRadius={16} />
        <SkeletonBox width={100} height={32} borderRadius={16} />
        <SkeletonBox width={90} height={32} borderRadius={16} />
      </View>
    </View>
  );
};

// Skeleton pour liste de conversations
export const ConversationSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={{
      flexDirection: 'row',
      padding: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      {/* Avatar */}
      <SkeletonBox width={50} height={50} borderRadius={25} />
      
      <View style={{ marginLeft: 12, flex: 1 }}>
        {/* Nom */}
        <SkeletonBox width="50%" height={18} marginBottom={8} />
        
        {/* Dernier message */}
        <SkeletonBox width="80%" height={14} />
      </View>

      {/* Timestamp */}
      <SkeletonBox width={50} height={14} />
    </View>
  );
};

// Skeleton pour grille de découverte
export const DiscoveryGridSkeleton: React.FC = () => {
  return (
    <View style={{ padding: 16 }}>
      <View style={{ 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        gap: 16 
      }}>
        {[...Array(6)].map((_, index) => (
          <UserProfileSkeleton key={index} />
        ))}
      </View>
    </View>
  );
};

// Skeleton pour messages du chat
export const MessageSkeleton: React.FC<{ isOwnMessage?: boolean }> = ({ 
  isOwnMessage = false 
}) => {
  const { colors } = useTheme();

  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
      marginVertical: 4,
      paddingHorizontal: 16,
    }}>
      {!isOwnMessage && (
        <SkeletonBox width={32} height={32} borderRadius={16} />
      )}
      
      <View style={{
        marginLeft: isOwnMessage ? 0 : 8,
        marginRight: isOwnMessage ? 8 : 0,
        maxWidth: '70%',
      }}>
        <SkeletonBox 
          width={Math.random() * 100 + 100} 
          height={Math.random() * 20 + 40} 
          borderRadius={18}
        />
      </View>

      {isOwnMessage && (
        <SkeletonBox width={32} height={32} borderRadius={16} />
      )}
    </View>
  );
};

// Skeleton pour chat complet
export const ChatSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      {/* Messages aléatoires */}
      {[...Array(8)].map((_, index) => (
        <MessageSkeleton 
          key={index} 
          isOwnMessage={Math.random() > 0.5}
        />
      ))}
    </View>
  );
};

// Skeleton pour carte de jeu
export const GameCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={{
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}>
      {/* En-tête */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <SkeletonBox width={40} height={40} borderRadius={8} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <SkeletonBox width="60%" height={18} marginBottom={6} />
          <SkeletonBox width="40%" height={14} />
        </View>
      </View>

      {/* Description */}
      <SkeletonBox width="100%" height={14} marginBottom={6} />
      <SkeletonBox width="80%" height={14} marginBottom={12} />

      {/* Tags et rating */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SkeletonBox width={60} height={24} borderRadius={12} />
          <SkeletonBox width={80} height={24} borderRadius={12} />
        </View>
        <SkeletonBox width={50} height={24} borderRadius={12} />
      </View>
    </View>
  );
};

// Skeleton pour liste complète avec header
export const ListSkeletonWithHeader: React.FC<{
  itemCount?: number;
  hasSearch?: boolean;
  hasFilters?: boolean;
}> = ({ 
  itemCount = 5, 
  hasSearch = false, 
  hasFilters = false 
}) => {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header avec recherche */}
      {hasSearch && (
        <View style={{ padding: 16 }}>
          <SkeletonBox width="100%" height={44} borderRadius={22} />
        </View>
      )}

      {/* Filtres */}
      {hasFilters && (
        <View style={{ 
          flexDirection: 'row', 
          paddingHorizontal: 16, 
          paddingBottom: 16,
          gap: 8 
        }}>
          <SkeletonBox width={80} height={32} borderRadius={16} />
          <SkeletonBox width={100} height={32} borderRadius={16} />
          <SkeletonBox width={70} height={32} borderRadius={16} />
        </View>
      )}

      {/* Liste d'éléments */}
      {[...Array(itemCount)].map((_, index) => (
        <ConversationSkeleton key={index} />
      ))}
    </View>
  );
};

// Export des types
export type SkeletonType = 
  | 'userProfile'
  | 'conversation'
  | 'discoveryGrid'
  | 'chat'
  | 'gameCard'
  | 'listWithHeader';

// Composant skeleton universel
export const UniversalSkeleton: React.FC<{
  type: SkeletonType;
  count?: number;
  [key: string]: any;
}> = ({ type, count = 1, ...props }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'userProfile':
        return <UserProfileSkeleton {...props} />;
      case 'conversation':
        return <ConversationSkeleton {...props} />;
      case 'discoveryGrid':
        return <DiscoveryGridSkeleton {...props} />;
      case 'chat':
        return <ChatSkeleton {...props} />;
      case 'gameCard':
        return <GameCardSkeleton {...props} />;
      case 'listWithHeader':
        return <ListSkeletonWithHeader {...props} />;
      default:
        return <SkeletonBox {...props} />;
    }
  };

  if (count === 1) {
    return renderSkeleton();
  }

  return (
    <>
      {[...Array(count)].map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </>
  );
};

export default UniversalSkeleton; 