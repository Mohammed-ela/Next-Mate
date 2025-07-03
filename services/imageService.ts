import Toast from 'react-native-toast-message';
import CloudinaryService from './cloudinaryService';

// 📸 Service pour gérer les images avec Cloudinary
export class ImageService {
  
  // 🔄 Uploader une image vers Cloudinary
  static async uploadImage(
    localUri: string, 
    userId: string, 
    imageType: 'avatar' | 'profile' = 'avatar'
  ): Promise<string | null> {
    try {
      console.log('📸 Upload image vers Cloudinary:', localUri);
      
      // Vérifier si Cloudinary est configuré
      if (!CloudinaryService.isConfigured()) {
        console.log('ℹ️ Cloudinary non configuré, mode local');
        return localUri;
      }
      
      // Toast de chargement
      Toast.show({
        type: 'upload',
        text1: '📸 Sauvegarde en cours...',
        text2: 'Votre avatar est en cours de mise à jour',
        visibilityTime: 0, // Reste affiché jusqu'à ce qu'on le cache
      });

      // Upload vers Cloudinary
      const result = await CloudinaryService.uploadImage(localUri, userId, {
        width: 300,
        height: 300,
        quality: 'auto',
        format: 'auto'
      });

      // Cacher le toast de chargement
      Toast.hide();
      
      if (result.success && result.url) {
        console.log('✅ Image uploadée vers Cloudinary:', result.url);
        
        // Toast de succès
        Toast.show({
          type: 'success',
          text1: '✅ Avatar mis à jour !',
          text2: 'Votre nouvelle photo de profil a été sauvegardée',
          visibilityTime: 3000,
        });
        
        return result.url;
      } else {
        console.error('❌ Échec upload Cloudinary:', result.error);
        
        // Toast d'info - fallback local
        Toast.show({
          type: 'info',
          text1: '📱 Avatar sauvegardé localement',
          text2: 'Votre photo sera synchronisée prochainement',
          visibilityTime: 4000,
        });
        
        // Fallback vers l'URI locale
        return localUri;
      }
      
    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      
      // Toast d'erreur
      Toast.show({
        type: 'error',
        text1: '❌ Erreur de sauvegarde',
        text2: 'Impossible de sauvegarder l\'image. Réessayez.',
        visibilityTime: 4000,
      });
      
      return null;
    }
  }
  
  // 🗑️ Supprimer une image de Cloudinary
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Vérifier si c'est une image Cloudinary
      if (this.isCloudinaryImage(imageUrl)) {
        // Extraire le public_id de l'URL Cloudinary
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if (publicId) {
          return await CloudinaryService.deleteImage(publicId);
        }
      }
      
      console.log('ℹ️ Image locale ou non-Cloudinary, pas de suppression nécessaire');
      return true;
      
    } catch (error) {
      console.error('⚠️ Erreur suppression image (non critique):', error);
      return false;
    }
  }
  
  // 🔄 Remplacer une image
  static async replaceImage(
    newLocalUri: string,
    oldImageUrl: string | undefined,
    userId: string,
    imageType: 'avatar' | 'profile' = 'avatar'
  ): Promise<string | null> {
    try {
      // En mode local, on retourne juste la nouvelle URI
      return await this.uploadImage(newLocalUri, userId, imageType);
      
    } catch (error) {
      console.error('❌ Erreur remplacement image:', error);
      return null;
    }
  }
  
  // 🔍 Vérifier si une URL est une image locale
  static isLocalImage(url: string): boolean {
    return url.startsWith('file://') || url.startsWith('content://');
  }
  
  // 🔍 Vérifier si une URL est une image Cloudinary
  static isCloudinaryImage(url: string): boolean {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }
  
  // 🔍 Extraire le public_id d'une URL Cloudinary
  static extractPublicIdFromUrl(url: string): string | null {
    try {
      // Format typique: https://res.cloudinary.com/nextmate/image/upload/v1234567890/nextmate/avatars/avatar_userId_timestamp.jpg
      const match = url.match(/\/([^\/]+)\/([^\/]+)\/([^\/\?]+)/);
      if (match && match[3]) {
        // Retirer l'extension
        return match[3].replace(/\.[^/.]+$/, '');
      }
      return null;
    } catch (error) {
      console.error('Erreur extraction public_id:', error);
      return null;
    }
  }

  // 🔍 Détecter le type d'avatar
  static detectAvatarType(avatar: string): 'cloudinary' | 'local' | 'emoji' | 'url' {
    if (this.isCloudinaryImage(avatar)) return 'cloudinary';
    if (this.isLocalImage(avatar)) return 'local';
    if (avatar.startsWith('http')) return 'url';
    return 'emoji';
  }
  
  // 📋 Informations sur le mode actuel
  static getStorageMode(): 'cloudinary' | 'local' {
    return CloudinaryService.isConfigured() ? 'cloudinary' : 'local';
  }
  
  // 💡 Message informatif pour l'utilisateur
  static getStorageInfo(): string {
    return CloudinaryService.isConfigured() 
      ? "Images stockées sur Cloudinary avec optimisation automatique ✨"
      : "Mode développement : images stockées localement.";
  }
}

export default ImageService; 