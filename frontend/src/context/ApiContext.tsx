// frontend/src/context/ApiContext.tsx
// API client context for backend communication

import React, { createContext, useContext, ReactNode } from 'react';
import axios, { AxiosInstance } from 'axios';

interface ApiContextType {
  apiClient: AxiosInstance;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

interface ApiProviderProps {
  children: ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
      }
      return Promise.reject(error);
    }
  );

  const value: ApiContextType = {
    apiClient,
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};