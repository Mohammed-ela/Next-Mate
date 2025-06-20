import storage from '@react-native-firebase/storage';
import { Alert } from 'react-native';

// 📸 Service pour gérer les images avec Firebase Storage
export class ImageService {
  
  // 🔄 Uploader une image vers Firebase Storage
  static async uploadImage(
    localUri: string, 
    userId: string, 
    imageType: 'avatar' | 'profile' = 'avatar'
  ): Promise<string | null> {
    try {
      console.log('📸 Début upload image:', localUri);
      
      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileName = `${imageType}_${userId}_${timestamp}.jpg`;
      const storagePath = `users/${userId}/${fileName}`;
      
      // Créer la référence Firebase Storage
      const reference = storage().ref(storagePath);
      
      // Uploader le fichier
      console.log('⬆️ Upload vers:', storagePath);
      const uploadTask = reference.putFile(localUri);
      
      // Attendre la fin de l'upload
      await uploadTask;
      
      // Récupérer l'URL de téléchargement
      const downloadURL = await reference.getDownloadURL();
      
      console.log('✅ Image uploadée avec succès:', downloadURL);
      return downloadURL;
      
    } catch (error) {
      console.error('❌ Erreur upload image:', error);
      Alert.alert(
        'Erreur d\'upload', 
        'Impossible d\'uploader l\'image. Vérifiez votre connexion internet.'
      );
      return null;
    }
  }
  
  // 🗑️ Supprimer une ancienne image
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!imageUrl || !imageUrl.includes('firebase')) {
        return true; // Pas une image Firebase, rien à supprimer
      }
      
      console.log('🗑️ Suppression ancienne image:', imageUrl);
      
      // Extraire le chemin depuis l'URL Firebase
      const reference = storage().refFromURL(imageUrl);
      await reference.delete();
      
      console.log('✅ Ancienne image supprimée');
      return true;
      
    } catch (error) {
      console.error('⚠️ Erreur suppression image (non critique):', error);
      return false; // Non critique, on continue
    }
  }
  
  // 🔄 Remplacer une image (supprimer l'ancienne + uploader la nouvelle)
  static async replaceImage(
    newLocalUri: string,
    oldImageUrl: string | undefined,
    userId: string,
    imageType: 'avatar' | 'profile' = 'avatar'
  ): Promise<string | null> {
    try {
      // 1. Uploader la nouvelle image
      const newImageUrl = await this.uploadImage(newLocalUri, userId, imageType);
      
      if (!newImageUrl) {
        return null; // Échec upload
      }
      
      // 2. Supprimer l'ancienne image (en arrière-plan, non bloquant)
      if (oldImageUrl) {
        this.deleteImage(oldImageUrl).catch(err => 
          console.log('⚠️ Suppression ancienne image échouée (non critique):', err)
        );
      }
      
      return newImageUrl;
      
    } catch (error) {
      console.error('❌ Erreur remplacement image:', error);
      return null;
    }
  }
  
  // 🔍 Vérifier si une URL est une image Firebase
  static isFirebaseImage(url: string): boolean {
    return url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com');
  }
  
  // 🔍 Vérifier si une URL est une image locale
  static isLocalImage(url: string): boolean {
    return url.startsWith('file://') || url.startsWith('content://');
  }
  
  // 🔍 Détecter le type d'avatar
  static detectAvatarType(avatar: string): 'firebase' | 'local' | 'emoji' | 'url' {
    if (this.isFirebaseImage(avatar)) return 'firebase';
    if (this.isLocalImage(avatar)) return 'local';
    if (avatar.startsWith('http')) return 'url';
    return 'emoji';
  }
}

export default ImageService; 