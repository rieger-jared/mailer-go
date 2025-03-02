import React, { useState } from 'react';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, error, login, checkAuth } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async () => {
    try {
      setIsAuthenticating(true);
      await login();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRetry = async () => {
    try {
      setIsAuthenticating(true);
      await checkAuth();
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
        <p className='text-lg'>Checking authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className='flex flex-col items-center justify-center h-screen p-4'>
        <div className='max-w-md w-full bg-card p-6 rounded-lg shadow-lg dark:bg-gray-800'>
          <h1 className='text-2xl font-bold mb-4 dark:text-white'>
            Authentication Required
          </h1>

          <p className='mb-6 dark:text-gray-300'>
            You need to authenticate with your Google account to access your
            emails. This application requires access to your Gmail account.
          </p>

          {error && (
            <div className='bg-destructive/10 text-destructive p-3 rounded-md mb-4 dark:bg-red-900/30 dark:text-red-300'>
              <p className='font-medium'>Authentication Error</p>
              <p className='text-sm'>{error}</p>
              <Button
                onClick={handleRetry}
                variant='outline'
                className='mt-2 text-xs'
                disabled={isAuthenticating}
              >
                Retry Authentication Check
              </Button>
            </div>
          )}

          <div className='flex flex-col space-y-4'>
            <Button
              onClick={handleLogin}
              className='w-full'
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Authenticating...
                </>
              ) : (
                'Sign in with Google'
              )}
            </Button>

            <div className='text-sm text-muted-foreground dark:text-gray-400'>
              <p className='mb-1'>
                This will open a browser window for you to authenticate with
                Google.
              </p>
              <p className='mb-1'>
                After authentication, you'll need to copy the authorization code
                from the URL and paste it when prompted.
              </p>
              <p>
                Your credentials are stored locally and are not shared with any
                third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;
