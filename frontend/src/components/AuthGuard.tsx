import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, error, login } = useAuth();

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
        <div className='max-w-md w-full bg-card p-6 rounded-lg shadow-lg'>
          <h1 className='text-2xl font-bold mb-4'>Authentication Required</h1>

          <p className='mb-6'>
            You need to authenticate with your Google account to access your
            emails. This application requires access to your Gmail account.
          </p>

          {error && (
            <div className='bg-destructive/10 text-destructive p-3 rounded-md mb-4'>
              <p className='font-medium'>Authentication Error</p>
              <p className='text-sm'>{error}</p>
            </div>
          )}

          <div className='flex flex-col space-y-4'>
            <Button onClick={login} className='w-full' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Authenticating...
                </>
              ) : (
                'Sign in with Google'
              )}
            </Button>

            <div className='text-sm text-muted-foreground'>
              <p>
                This will open a browser window for you to authenticate with
                Google.
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
