import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { invoke } from '@tauri-apps/api/core';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (provider: 'google') => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus().catch(console.error);
  }, []);

  // Check if credentials exist and are valid
  const checkAuthStatus = async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await invoke<{ success: boolean; error?: string }>(
        'check_auth_status'
      );

      const isAuthenticated = response.success;
      setState((prev) => ({ ...prev, isAuthenticated, isLoading: false }));
      return isAuthenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
      return false;
    }
  };

  // Login with Google
  const login = async (provider: 'google') => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      if (provider !== 'google') {
        throw new Error('Only Google authentication is supported');
      }

      const response = await invoke<{ success: boolean; error?: string }>(
        'google_auth_login'
      );

      if (response.success) {
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  // Logout
  const logout = async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await invoke<{ success: boolean }>('logout');
      setState({ isAuthenticated: false, isLoading: false, error: null });
    } catch (error) {
      console.error('Logout error:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const value = {
    ...state,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
