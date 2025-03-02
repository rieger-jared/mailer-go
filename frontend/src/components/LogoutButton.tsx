import React, { useState } from 'react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const LogoutButton: React.FC = () => {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <>
          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          Signing out...
        </>
      ) : (
        'Sign out'
      )}
    </Button>
  );
};

export default LogoutButton;
