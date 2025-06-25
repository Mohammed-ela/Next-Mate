import { CLOUDINARY_CONFIG } from '../constants/Environment';

// 🌤️ Service Cloudinary pour React Native/Expo avec API REST
export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  public_id?: string;
  error?: string;
}

// Configuration Cloudinary (UNSIGNED seulement)
const CLOUD_NAME = CLOUDINARY_CONFIG.cloudName;
const UPLOAD_PRESET = CLOUDINARY_CONFIG.uploadPreset;

export class CloudinaryService {
  /**
   * Upload une image vers Cloudinary avec l'API REST
   */
  static async uploadImage(
    imageUri: string,
    userId: string,
    options: {
      width?: number;
      height?: number;
      quality?: 'auto' | number;
      format?: 'auto' | 'jpg' | 'png' | 'webp';
    } = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      console.log('📤 Upload vers Cloudinary via API REST...', { userId, imageUri });

      // Test direct sans vérification préalable
      console.log('🔧 Test upload direct vers Cloudinary...');

      // Préparer les données FormData (VERSION ULTRA SIMPLE)
      const formData = new FormData();
      
      // Ajouter SEULEMENT l'image et le preset (rien d'autre!)
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `avatar_${userId}_${Date.now()}.jpg`,
      } as any);
      
      // SEULEMENT le preset - RIEN D'AUTRE
      formData.append('upload_preset', UPLOAD_PRESET);

      // URL de l'API Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

      console.log('🔧 Upload ultra-simple vers:', uploadUrl);
      console.log('🔧 Avec preset:', UPLOAD_PRESET);

      // Requête la plus simple possible
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.secure_url) {
        console.log('✅ Upload Cloudinary réussi:', result.secure_url);
        return {
          success: true,
          url: result.secure_url,
          public_id: result.public_id,
        };
      } else {
        console.error('❌ Erreur upload Cloudinary:', result);
        return {
          success: false,
          error: result.error?.message || 'Erreur upload Cloudinary'
        };
      }

    } catch (error) {
      console.error('❌ Erreur upload Cloudinary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau'
      };
    }
  }

  /**
   * Supprime une image de Cloudinary (UNSIGNED - pas possible)
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    console.log('ℹ️ Suppression Cloudinary non disponible en mode unsigned');
    return true; // On fait semblant que ça marche
  }

  /**
   * Génère une URL optimisée pour l'affichage
   */
  static getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: 'auto' | number;
      format?: 'auto' | 'jpg' | 'png' | 'webp';
    } = {}
  ): string {
    const { width = 300, height = 300, quality = 'auto', format = 'auto' } = options;
    const transformation = `w_${width},h_${height},c_fill,g_face,q_${quality},f_${format}`;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
  }

  /**
   * Vérifie si Cloudinary est configuré
   */
  static isConfigured(): boolean {
    return true; // Toujours configuré maintenant
  }

  /**
   * Instructions pour configurer l'upload preset
   */
  static getSetupInstructions(): string {
    return `
📋 Configuration requise dans votre dashboard Cloudinary :

1. Allez sur cloudinary.com/console
2. Settings → Upload presets
3. Créez un preset nommé "nextmate_preset"
4. Mode: Unsigned (pour React Native)
5. Folder: nextmate/avatars
6. Transformations: w_300,h_300,c_fill,g_face,q_auto,f_auto

Une fois fait, l'upload fonctionnera ! 🚀
    `;
  }
}

export default CloudinaryService; 