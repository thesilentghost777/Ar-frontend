import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Configuration, Session, CentreExamen, LieuPratique } from '../types';
import { apiRequest } from '../config/api';

interface ConfigContextType {
  configuration: Configuration | null;
  sessions: Session[];
  centresExamen: CentreExamen[];
  lieuxPratique: LieuPratique[];
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  getDefaultParrainageCode: () => Promise<string>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configuration, setConfiguration] = useState<Configuration | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [centresExamen, setCentresExamen] = useState<CentreExamen[]>([]);
  const [lieuxPratique, setLieuxPratique] = useState<LieuPratique[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const [configRes, sessionsRes, centresRes, lieuxRes] = await Promise.all([
        apiRequest<Configuration>('/configuration', { method: 'GET' }),
        apiRequest<{ success: boolean; sessions: Session[] }>('/sessions', { method: 'GET' }),
        apiRequest<{ success: boolean; centres_examen: CentreExamen[] }>('/centres-examen', { method: 'GET' }),
        apiRequest<{ success: boolean; lieux_pratique: LieuPratique[] }>('/lieux-pratique', { method: 'GET' }),
      ]);

      setConfiguration(configRes);
      setSessions(sessionsRes.sessions || []);
      setCentresExamen(centresRes.centres_examen || []);
      setLieuxPratique(lieuxRes.lieux_pratique || []);
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConfig = async () => {
    await loadConfiguration();
  };

  const getDefaultParrainageCode = async (): Promise<string> => {
    try {
      const response = await apiRequest<{ success: boolean; code_parrainage: string }>(
        '/code-parrainage-defaut',
        { method: 'GET' }
      );
      return response.code_parrainage || '';
    } catch (error) {
      console.error('Error getting default parrainage code:', error);
      return '';
    }
  };

  return (
    <ConfigContext.Provider
      value={{
        configuration,
        sessions,
        centresExamen,
        lieuxPratique,
        isLoading,
        refreshConfig,
        getDefaultParrainageCode,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
