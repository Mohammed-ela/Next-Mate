/**
 * Nettoie un objet en supprimant toutes les valeurs undefined
 * pour éviter les erreurs Firebase
 */
export const cleanObjectForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanObjectForFirestore).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = cleanObjectForFirestore(obj[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
};

/**
 * Valide qu'un objet ne contient pas de valeurs undefined
 * avant envoi à Firestore
 */
export const validateForFirestore = (obj: any, path = ''): void => {
  if (obj === undefined) {
    console.warn(`⚠️ Valeur undefined trouvée à: ${path}`);
    return;
  }
  
  if (obj === null || typeof obj !== 'object') {
    return;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      validateForFirestore(item, `${path}[${index}]`);
    });
    return;
  }
  
  Object.keys(obj).forEach(key => {
    const currentPath = path ? `${path}.${key}` : key;
    validateForFirestore(obj[key], currentPath);
  });
};

/**
 * Convertit un timestamp Firebase en Date de manière sûre
 * Gère les cas où le timestamp n'est pas encore résolu (serverTimestamp())
 */
export const safeTimestampToDate = (timestamp: any): Date => {
  if (!timestamp) {
    return new Date();
  }
  
  // Si c'est déjà une Date
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // Si c'est un timestamp Firebase avec la méthode toDate
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('⚠️ Erreur conversion timestamp:', error);
      return new Date();
    }
  }
  
  // Si c'est un timestamp en millisecondes
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // Si c'est une string de date
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // Fallback
  console.warn('⚠️ Type de timestamp non reconnu:', typeof timestamp, timestamp);
  return new Date();
};

/**
 * Fonction spécifique pour nettoyer les données participant avant Firestore
 * Évite les erreurs avec les valeurs undefined
 */
export const cleanParticipantData = (participant: any): any => {
  const cleaned: any = {
    name: participant.name || 'Utilisateur',
    avatar: participant.avatar || '🎮',
    isImageAvatar: participant.isImageAvatar || false,
    isOnline: participant.isOnline || false,
  };
  
  // Ajouter seulement les champs définis et non-vides
  if (participant.bio !== undefined && participant.bio !== null) {
    cleaned.bio = participant.bio;
  }
  if (participant.currentGame !== undefined && participant.currentGame !== null) {
    cleaned.currentGame = participant.currentGame;
  }
  if (participant.lastSeen !== undefined && participant.lastSeen !== null) {
    cleaned.lastSeen = participant.lastSeen;
  }
  
  return cleaned;
}; 