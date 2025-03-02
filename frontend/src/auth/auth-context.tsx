import React, { createContext, useContext, useState, useEffect } from 'react';
import { GmailClientService } from '../../bindings/changeme';

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

      console.log('Checking authentication status...');
      const isAuthed = await GmailClientService.IsAuthenticated();
      console.log('Authentication status:', isAuthed);

      setIsAuthenticated(isAuthed);
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

      // Try to open the auth URL directly in the browser
      try {
        const authUrl = await GmailClientService.OpenAuthURL();
        console.log('Auth URL opened:', authUrl);
      } catch (err) {
        console.error('Failed to open auth URL directly:', err);

        // Fallback to getting the URL and opening it manually
        console.log('Falling back to manual URL opening...');
        const authUrl = await GmailClientService.GetAuthURL();
        console.log('Auth URL:', authUrl);

        // Open the auth URL in a new window
        const authWindow = window.open(
          authUrl,
          '_blank',
          'width=800,height=600'
        );

        if (!authWindow) {
          throw new Error(
            'Failed to open authentication window. Please check your popup blocker settings.'
          );
        }
      }

      // Show instructions to the user
      alert(
        'Please sign in with your Google account in the opened browser window.\n\n' +
          "After authentication, you'll be redirected to a page with a code or a URL containing the code.\n\n" +
          'You can either:\n' +
          '1. Copy the entire URL from the address bar, or\n' +
          '2. Copy just the code shown on the page\n\n' +
          'Then paste it in the next prompt. The application will automatically extract the code if needed.'
      );

      // Wait for user to complete authentication and get the code
      const authCode = prompt(
        'Please paste the authorization code or the entire URL from Google:'
      );

      if (!authCode) {
        setError('No authorization code provided. Please try again.');
        return;
      }

      console.log('Completing authentication with code...');
      // Clean the auth code (remove any whitespace and extract just the code if needed)
      let cleanedCode = authCode.trim();

      // If the user copied the entire URL, extract just the code
      if (cleanedCode.includes('code=')) {
        const codeMatch = cleanedCode.match(/code=([^&]+)/);
        if (codeMatch && codeMatch[1]) {
          cleanedCode = codeMatch[1];
          console.log('Extracted code from URL:', cleanedCode);
        }
      }

      const success = await GmailClientService.CompleteAuth(cleanedCode);
      console.log('Authentication result:', success);

      if (success) {
        setIsAuthenticated(true);
        console.log('Authentication successful');
      } else {
        setError('Authentication failed. Please try again.');
        console.error('Authentication failed: CompleteAuth returned false');
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

      console.log('Logging out...');
      const success = await GmailClientService.Logout();

      if (success) {
        setIsAuthenticated(false);
        console.log('Logged out successfully');
      } else {
        setError('Logout failed. Please try again.');
        console.error('Logout failed: Logout returned false');
      }
    } catch (err) {
      console.error('Error during logout:', err);
      setError(
        err instanceof Error ? err.message : 'Unknown error during logout'
      );
      // Even if the server-side logout fails, we'll still update the UI state
      setIsAuthenticated(false);
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
