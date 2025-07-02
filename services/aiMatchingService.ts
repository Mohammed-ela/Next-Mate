import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { UserProfile } from './userService';

// Configuration Mistral
const MISTRAL_CONFIG = {
  API_KEY: '0dFjQcToOwPJaEMEftIQgnA6VIlOnVTt',
  BASE_URL: 'https://api.mistral.ai/v1/chat/completions',
  MODEL: 'mistral-large-latest',
  MAX_TOKENS: 1000,
  TEMPERATURE: 0.7,
};

// Limitation utilisateur : 1 requête par 24h
const RATE_LIMIT = {
  REQUESTS_PER_DAY: 1,
  STORAGE_KEY: 'nextmate_ai_requests',
};

interface AIRequest {
  userId: string;
  timestamp: number;
  prompt: string;
}

interface MistralResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export class AiMatchingService {
  private static instance: AiMatchingService;

  static getInstance(): AiMatchingService {
    if (!AiMatchingService.instance) {
      AiMatchingService.instance = new AiMatchingService();
    }
    return AiMatchingService.instance;
  }

  // 🚫 Vérifier si l'utilisateur peut faire une requête IA
  async canMakeRequest(userId: string): Promise<{ canRequest: boolean; nextAvailableTime?: Date }> {
    try {
      const storedRequests = await AsyncStorage.getItem(RATE_LIMIT.STORAGE_KEY);
      const requests: AIRequest[] = storedRequests ? JSON.parse(storedRequests) : [];
      
      const now = Date.now();
      const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
      
      // Nettoyer les anciennes requêtes
      const recentRequests = requests.filter(req => req.timestamp > twentyFourHoursAgo);
      
      // Compter les requêtes de cet utilisateur dans les dernières 24h
      const userRequests = recentRequests.filter(req => req.userId === userId);
      
      if (userRequests.length >= RATE_LIMIT.REQUESTS_PER_DAY) {
        const oldestRequest = userRequests[0];
        const nextAvailableTime = new Date(oldestRequest.timestamp + (24 * 60 * 60 * 1000));
        
        return {
          canRequest: false,
          nextAvailableTime,
        };
      }
      
      return { canRequest: true };
      
    } catch (error) {
      logger.error('AiMatchingService', 'Erreur vérification rate limit', error);
      return { canRequest: true }; // En cas d'erreur, on autorise
    }
  }

  // 📝 Enregistrer une requête IA
  private async recordRequest(userId: string, prompt: string): Promise<void> {
    try {
      const storedRequests = await AsyncStorage.getItem(RATE_LIMIT.STORAGE_KEY);
      const requests: AIRequest[] = storedRequests ? JSON.parse(storedRequests) : [];
      
      const newRequest: AIRequest = {
        userId,
        timestamp: Date.now(),
        prompt,
      };
      
      requests.push(newRequest);
      
      // Garder seulement les requêtes des 48 dernières heures pour le nettoyage
      const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
      const cleanedRequests = requests.filter(req => req.timestamp > fortyEightHoursAgo);
      
      await AsyncStorage.setItem(RATE_LIMIT.STORAGE_KEY, JSON.stringify(cleanedRequests));
      
    } catch (error) {
      logger.error('AiMatchingService', 'Erreur enregistrement requête', error);
    }
  }

  // 🧠 Générer le prompt pour Mistral
  private generatePrompt(userProfile: UserProfile, userPrompt: string, availableUsers: UserProfile[]): string {
    const userGames = userProfile.preferences.favoriteGames?.join(', ') || 'Aucun';
    const userStyle = userProfile.preferences.gameStyles?.join(', ') || 'Non spécifié';
    const userTimeSlots = userProfile.preferences.preferredTimeSlots?.join(', ') || 'Flexible';
    
    // Limiter à 20 utilisateurs pour réduire les tokens
    const limitedUsers = availableUsers.slice(0, 20);
    
    const userProfiles = limitedUsers.map((user, index) => {
      const games = user.preferences.favoriteGames?.slice(0, 3).join(', ') || 'Aucun';
      const bio = user.preferences.bio || 'Pas de bio';
      const timeSlots = user.preferences.preferredTimeSlots?.slice(0, 2).join(', ') || 'Flexible';
      
      return `${index + 1}. ${user.name}
- Jeux: ${games}
- Bio: "${bio.substring(0, 100)}"
- Disponibilités: ${timeSlots}
- Âge: ${user.preferences.ageRange || 'Non spécifié'}
- Genre: ${user.preferences.gender || 'Non spécifié'}
- Rating: ${user.stats.rating}`;
    }).join('\n\n');

    return `Tu es un expert en matching gaming pour NextMate, une app de rencontres pour gamers.

PROFIL UTILISATEUR:
- Nom: ${userProfile.name}
- Jeux favoris: ${userGames}
- Style de jeu: ${userStyle}
- Disponibilités: ${userTimeSlots}
- Bio: "${userProfile.preferences.bio || 'Pas de bio'}"

DEMANDE UTILISATEUR: "${userPrompt}"

PROFILS DISPONIBLES:
${userProfiles}

MISSION: Sélectionne exactement 3 profils qui correspondent le mieux à la demande. Considère:
- Compatibilité des jeux
- Style de jeu complémentaire
- Disponibilités qui se chevauchent
- Personnalité compatible selon les bios
- La demande spécifique de l'utilisateur

RÉPONSE ATTENDUE: Réponds UNIQUEMENT avec les 3 numéros séparés par des virgules (exemple: "1,5,12"). Pas d'explication, juste les numéros.`;
  }

  // 🤖 Appeler l'API Mistral
  private async callMistralAPI(prompt: string): Promise<string> {
    try {
      logger.info('AiMatchingService', 'Appel API Mistral...');
      
      const response = await fetch(MISTRAL_CONFIG.BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${MISTRAL_CONFIG.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MISTRAL_CONFIG.MODEL,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: MISTRAL_CONFIG.MAX_TOKENS,
          temperature: MISTRAL_CONFIG.TEMPERATURE,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API Mistral: ${response.status} ${response.statusText}`);
      }

      const data: MistralResponse = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      if (!aiResponse) {
        throw new Error('Réponse IA vide');
      }

      logger.info('AiMatchingService', 'Réponse Mistral reçue', { response: aiResponse });
      return aiResponse;
      
    } catch (error) {
      logger.error('AiMatchingService', 'Erreur appel Mistral API', error);
      throw new Error('Service IA temporairement indisponible');
    }
  }

  // 🎯 Générer des recommandations IA
  async generateRecommendations(
    userId: string,
    userProfile: UserProfile,
    userPrompt: string,
    availableUsers: UserProfile[]
  ): Promise<UserProfile[]> {
    try {
      // 1. Vérifier rate limiting - TEMPORAIREMENT DÉSACTIVÉ POUR LES TESTS
      // const { canRequest, nextAvailableTime } = await this.canMakeRequest(userId);
      // if (!canRequest) {
      //   const timeRemaining = nextAvailableTime!.toLocaleString('fr-FR');
      //   throw new Error(`Limite atteinte. Prochaine requête possible le ${timeRemaining}`);
      // }

      // 2. Filtrer les utilisateurs disponibles (enlever soi-même)
      const filteredUsers = availableUsers.filter(user => user.uid !== userId);
      
      if (filteredUsers.length < 3) {
        throw new Error('Pas assez d\'utilisateurs disponibles pour des recommandations IA');
      }

      // 3. Générer le prompt
      const prompt = this.generatePrompt(userProfile, userPrompt, filteredUsers);
      
      // 4. Appeler Mistral
      const aiResponse = await this.callMistralAPI(prompt);
      
      // 5. Parser la réponse (format attendu: "1,5,12")
      const selectedIndices = aiResponse
        .split(',')
        .map(num => parseInt(num.trim()) - 1) // Convertir en index 0-based
        .filter(index => index >= 0 && index < filteredUsers.length)
        .slice(0, 3); // Limiter à 3 maximum

      if (selectedIndices.length === 0) {
        throw new Error('L\'IA n\'a pas pu analyser votre demande');
      }

      // 6. Récupérer les profils sélectionnés
      const recommendations = selectedIndices.map(index => filteredUsers[index]);
      
      // 7. Enregistrer la requête - TEMPORAIREMENT DÉSACTIVÉ POUR LES TESTS
      // await this.recordRequest(userId, userPrompt);
      
      logger.info('AiMatchingService', 'Recommandations générées', {
        userId,
        promptLength: userPrompt.length,
        recommendationsCount: recommendations.length,
      });

      return recommendations;
      
    } catch (error) {
      logger.error('AiMatchingService', 'Erreur génération recommandations', error);
      throw error;
    }
  }

  // 📊 Obtenir les statistiques utilisateur
  async getUserStats(userId: string): Promise<{ requestsToday: number; canRequest: boolean; nextAvailableTime?: Date }> {
    const { canRequest, nextAvailableTime } = await this.canMakeRequest(userId);
    
    const storedRequests = await AsyncStorage.getItem(RATE_LIMIT.STORAGE_KEY);
    const requests: AIRequest[] = storedRequests ? JSON.parse(storedRequests) : [];
    
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentUserRequests = requests.filter(
      req => req.userId === userId && req.timestamp > twentyFourHoursAgo
    );

    return {
      requestsToday: recentUserRequests.length,
      canRequest,
      nextAvailableTime,
    };
  }
}

export default AiMatchingService.getInstance(); 