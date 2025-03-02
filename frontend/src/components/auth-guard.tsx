import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { LoginPage } from '@/components/login-page';
import { Spinner } from '@/components/ui/spinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, error } = useAuth();

  if (isLoading) {
    return (
      <div className='flex min-h-svh flex-col items-center justify-center'>
        <Spinner className='h-8 w-8' />
        <p className='mt-4 text-sm text-muted-foreground'>
          Checking authentication status...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage error={error} />;
  }

  return <>{children}</>;
}
