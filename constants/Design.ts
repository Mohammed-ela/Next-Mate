// Constants de design centralisées - NextMate
// Toutes les valeurs répétées dans l'app en un seul endroit

// Couleurs principales
export const COLORS = {
  // Couleurs principales NextMate
  PRIMARY_ORANGE: '#FF8E53',
  SECONDARY_ORANGE: '#FF6B35',
  PRIMARY_PURPLE: '#8B5CF6',
  SECONDARY_PURPLE: '#7C3AED',
  
  // Couleurs statuts
  SUCCESS_GREEN: '#10B981',
  SUCCESS_GREEN_DARK: '#059669',
  WARNING_YELLOW: '#F59E0B',
  ERROR_RED: '#EF4444',
  
  // Couleurs neutres
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  GRAY_LIGHT: '#9CA3AF',
  GRAY_MEDIUM: '#6B7280',
  GRAY_DARK: '#4B5563',
  
  // Transparences communes
  WHITE_10: 'rgba(255, 255, 255, 0.1)',
  WHITE_20: 'rgba(255, 255, 255, 0.2)',
  WHITE_30: 'rgba(255, 255, 255, 0.3)',
  WHITE_80: 'rgba(255, 255, 255, 0.8)',
  BLACK_10: 'rgba(0, 0, 0, 0.1)',
  BLACK_20: 'rgba(0, 0, 0, 0.2)',
  BLACK_50: 'rgba(0, 0, 0, 0.5)',
} as const;

// Gradients communs
export const GRADIENTS = {
  ORANGE: [COLORS.PRIMARY_ORANGE, COLORS.SECONDARY_ORANGE] as [string, string],
  PURPLE: [COLORS.PRIMARY_PURPLE, COLORS.SECONDARY_PURPLE] as [string, string],
  GREEN: [COLORS.SUCCESS_GREEN, COLORS.SUCCESS_GREEN_DARK] as [string, string],
  ORANGE_PURPLE: [COLORS.PRIMARY_ORANGE, COLORS.PRIMARY_PURPLE] as [string, string],
} as const;

// Tailles et espacements
export const SPACING = {
  // Marges et padding standards
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 32,
  
  // Espacements spécifiques fréquents
  CARD_PADDING: 20,
  SECTION_MARGIN: 24,
  HEADER_PADDING: 60,
} as const;

// Border radius
export const RADIUS = {
  // Rayons standards
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 20,
  XXL: 24,
  XXXL: 30,
  
  // Formes spécifiques
  CARD: 20,
  BUTTON: 12,
  MODAL: 20,
  BADGE: 10,
  AVATAR: 50, // Pourcentage pour cercle parfait
} as const;

// Typographie
export const TYPOGRAPHY = {
  // Tailles de police
  FONT_SIZE: {
    XS: 10,
    SM: 12,
    MD: 14,
    LG: 16,
    XL: 18,
    XXL: 20,
    XXXL: 24,
    TITLE: 28,
    HERO: 32,
  },
  
  // Poids de police
  FONT_WEIGHT: {
    REGULAR: '400' as const,
    MEDIUM: '500' as const,
    SEMIBOLD: '600' as const,
    BOLD: '700' as const,
    EXTRABOLD: '800' as const,
  },
  
  // Hauteurs de ligne
  LINE_HEIGHT: {
    TIGHT: 18,
    NORMAL: 20,
    RELAXED: 22,
    LOOSE: 24,
    EXTRA_LOOSE: 26,
  },
} as const;

// Ombres communes
export const SHADOWS = {
  // Ombres pour cartes
  CARD: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Ombres pour boutons
  BUTTON: {
    shadowColor: COLORS.PRIMARY_ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Ombres pour modales
  MODAL: {
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
} as const;

// Animations
export const ANIMATIONS = {
  // Durées standards
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
    EXTRA_SLOW: 800,
  },
  
  // Délais communs
  DELAY: {
    SHORT: 100,
    MEDIUM: 500,
    LONG: 1000,
  },
} as const;

// Dimensions
export const DIMENSIONS = {
  // Tailles d'avatars
  AVATAR: {
    SM: 32,
    MD: 48,
    LG: 64,
    XL: 80,
    XXL: 110,
  },
  
  // Tailles d'icônes
  ICON: {
    SM: 16,
    MD: 20,
    LG: 24,
    XL: 32,
  },
  
  // Tailles de boutons
  BUTTON_HEIGHT: {
    SM: 36,
    MD: 44,
    LG: 52,
  },
} as const;

// Utilitaires de style communs
export const COMMON_STYLES = {
  // Centre absolu
  CENTER: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  // Flex 1
  FLEX_1: {
    flex: 1,
  },
  
  // Positionnement
  ABSOLUTE: {
    position: 'absolute' as const,
  },
  
  // Texte centré
  TEXT_CENTER: {
    textAlign: 'center' as const,
  },
  
  // Cacher overflow
  HIDDEN: {
    overflow: 'hidden' as const,
  },
} as const;

// 🔗 EXPORT GROUPÉ POUR FACILITER L'IMPORT
export const DESIGN = {
  COLORS,
  GRADIENTS,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  SHADOWS,
  ANIMATIONS,
  DIMENSIONS,
  COMMON_STYLES,
} as const; 