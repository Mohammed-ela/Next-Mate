// 🛠️ FONCTIONS UTILITAIRES DE FORMATAGE - NEXTMATE
// Toutes les fonctions de formatage répétées dans l'app

import { COLORS } from '../constants/Design';

// ⏰ FORMATAGE DU TEMPS
export const formatTime = {
  // Formatage intelligent "il y a X temps"
  timeAgo: (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    } else {
      // Plus d'une semaine : afficher la date
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    }
  },

  // Formatage heure simple (14:30)
  timeOnly: (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Formatage date simple (15 déc)
  dateOnly: (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  },

  // Formatage complet pour l'accessibilité
  fullDateTime: (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
};

// 🎮 FORMATAGE GAMING
export const formatGaming = {
  // Affichage du rating avec couleur
  rating: (rating: number): { text: string; color: string } => {
    if (rating >= 1800) {
      return { text: `${rating} 👑`, color: '#FFD700' }; // Or
    } else if (rating >= 1500) {
      return { text: `${rating} 💎`, color: '#C0C0C0' }; // Argent
    } else if (rating >= 1200) {
      return { text: `${rating} 🥉`, color: '#CD7F32' }; // Bronze
    } else {
      return { text: `${rating}`, color: COLORS.GRAY_MEDIUM };
    }
  },

  // Formatage nombre de jeux
  gamesCount: (count: number): string => {
    if (count === 0) return 'Aucun jeu';
    if (count === 1) return '1 jeu';
    return `${count} jeux`;
  },

  // Formatage statut en ligne
  onlineStatus: (isOnline: boolean, lastActive?: Date): { emoji: string; text: string; color: string } => {
    if (isOnline) {
      return {
        emoji: '🟢',
        text: 'En ligne',
        color: COLORS.SUCCESS_GREEN
      };
    } else if (lastActive) {
      const diffInHours = Math.floor((new Date().getTime() - lastActive.getTime()) / (1000 * 60 * 60));
      if (diffInHours < 24) {
        return {
          emoji: '🟡',
          text: `Vu il y a ${diffInHours}h`,
          color: '#F59E0B'
        };
      }
    }
    return {
      emoji: '⚫',
      text: 'Hors ligne',
      color: COLORS.GRAY_MEDIUM
    };
  },
};

// 📱 FORMATAGE UI
export const formatUI = {
  // Raccourcissement de texte avec ellipse
  truncate: (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength).trim()}...`;
  },

  // Nettoyage de bio (espaces, retours à la ligne)
  cleanBio: (bio: string): string => {
    return bio.replace(/\s+/g, ' ').trim();
  },

  // Formatage de compteur (99+)
  counter: (count: number): string => {
    if (count > 99) return '99+';
    return count.toString();
  },

  // Capitalisation première lettre
  capitalize: (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Génération d'initiales
  initials: (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },
};

// 🎨 FORMATAGE COULEURS
export const formatColors = {
  // Couleur aléatoire pour avatar
  randomAvatarColor: (): string => {
    const colors = [
      COLORS.PRIMARY_ORANGE,
      COLORS.PRIMARY_PURPLE,
      COLORS.SUCCESS_GREEN,
      '#F59E0B', // Jaune
      '#EF4444', // Rouge
      '#3B82F6', // Bleu
      '#8B5CF6', // Violet
      '#10B981', // Vert emeraude
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // Couleur selon le genre
  genderColor: (gender?: string): string => {
    switch (gender) {
      case 'Homme': return '#3B82F6';
      case 'Femme': return '#EC4899';
      default: return COLORS.PRIMARY_PURPLE;
    }
  },

  // Couleur selon le type de jeu
  gameTypeColor: (gameType?: string): string => {
    const gameColors: { [key: string]: string } = {
      'FPS': '#EF4444',
      'MOBA': '#8B5CF6', 
      'RPG': '#10B981',
      'Sport': '#F59E0B',
      'Course': '#3B82F6',
      'Strategy': '#6B7280',
    };
    return gameColors[gameType || ''] || COLORS.PRIMARY_ORANGE;
  },
};

// 📊 FORMATAGE DONNÉES
export const formatData = {
  // Validation email
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validation pseudo (3-20 caractères, alphanumériques + _ -)
  isValidUsername: (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  },

  // Nettoyage de string pour recherche
  searchNormalize: (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .trim();
  },

  // Formatage taille de fichier
  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },
};

// 🎯 EXPORT GROUPÉ
export const formatters = {
  time: formatTime,
  gaming: formatGaming,
  ui: formatUI,
  colors: formatColors,
  data: formatData,
}; 