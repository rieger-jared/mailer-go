import React, { createContext, useContext, useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await invoke<{
        success: boolean;
        data: boolean;
        error: string | null;
      }>('check_auth');

      if (response.success && response.data !== undefined) {
        setIsAuthenticated(response.data);
      } else if (response.error) {
        setError(response.error);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Error checking authentication status:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error checking authentication'
      );
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await invoke<{
        success: boolean;
        data: boolean;
        error: string | null;
      }>('start_auth');

      if (response.success && response.data) {
        setIsAuthenticated(true);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unknown error during authentication'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await invoke<{
        success: boolean;
        data: boolean;
        error: string | null;
      }>('logout');

      if (response.success) {
        setIsAuthenticated(false);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      console.error('Error during logout:', err);
      setError(
        err instanceof Error ? err.message : 'Unknown error during logout'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
