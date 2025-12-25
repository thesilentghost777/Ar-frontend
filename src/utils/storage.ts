// ange-raphael/src/utils/storage.ts
import * as SecureStore from 'expo-secure-store';

/**
 * Utilitaires pour le stockage sécurisé des données
 */

export const storage = {
  /**
   * Récupère une valeur du stockage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Erreur lors de la lecture de ${key}:`, error);
      return null;
    }
  },

  /**
   * Stocke une valeur
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Erreur lors de l'écriture de ${key}:`, error);
      throw error;
    }
  },

  /**
   * Supprime une valeur
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${key}:`, error);
      throw error;
    }
  },

  /**
   * Récupère le token d'authentification
   */
  async getToken(): Promise<string | null> {
    return this.getItem('userToken');
  },

  /**
   * Stocke le token d'authentification
   */
  async setToken(token: string): Promise<void> {
    return this.setItem('userToken', token);
  },

  /**
   * Supprime le token d'authentification
   */
  async removeToken(): Promise<void> {
    return this.removeItem('userToken');
  },
};