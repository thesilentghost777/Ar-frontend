import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { apiRequest } from '../config/api';
import Toast from 'react-native-toast-message';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (telephone: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

interface RegisterData {
  nom: string;
  prenom: string;
  telephone: string;
  password: string;
  password_confirmation: string;
  date_naissance?: string;
  quartier?: string;
  type_permis: string;
  type_cours: string;
  vague: string;
  session_id?: number;
  centre_examen_id?: number;
  code_parrainage?: string;
  lieux_pratique?: number[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await apiRequest<{ success: boolean; user: User }>(
        '/profil',
        { method: 'GET' },
        authToken
      );
      if (response.success) {
        setUser(response.user);
      }
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      if (error.status === 401) {
        await logout();
      }
    }
  };

  const login = async (telephone: string, password: string): Promise<boolean> => {
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        user: User;
        token: string;
      }>('/connexion', {
        method: 'POST',
        body: JSON.stringify({ telephone, password }),
      });

      if (response.success) {
        await SecureStore.setItemAsync('auth_token', response.token);
        setToken(response.token);
        setUser(response.user);
        Toast.show({
          type: 'success',
          text1: 'Connexion réussie',
          text2: `Bienvenue ${response.user.prenom} !`,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de connexion',
        text2: error.message || 'Identifiants incorrects',
      });
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        user: User;
        code_parrainage: string;
      }>('/inscription', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Inscription réussie',
          text2: 'Vous pouvez maintenant vous connecter',
        });
        return true;
      }
      return false;
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur d\'inscription',
        text2: error.message || 'Une erreur est survenue',
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiRequest('/deconnexion', { method: 'POST' }, token);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await SecureStore.deleteItemAsync('auth_token');
      setToken(null);
      setUser(null);
      Toast.show({
        type: 'info',
        text1: 'Déconnexion',
        text2: 'À bientôt !',
      });
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
