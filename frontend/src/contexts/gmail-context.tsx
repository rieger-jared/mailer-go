import React, { createContext, useContext, ReactNode } from 'react';
import { useGmail } from '@/hooks/use-gmail';
import type { EmailLabel, EmailMessage, EmailThread } from '@/hooks/use-gmail';

// Create the context with a default value
const GmailContext = createContext<ReturnType<typeof useGmail> | undefined>(
  undefined
);

// Provider component
export function GmailProvider({ children }: { children: ReactNode }) {
  const gmailState = useGmail();

  return (
    <GmailContext.Provider value={gmailState}>{children}</GmailContext.Provider>
  );
}

// Hook to use the Gmail context
export function useGmailContext() {
  const context = useContext(GmailContext);

  if (context === undefined) {
    throw new Error('useGmailContext must be used within a GmailProvider');
  }

  return context;
}

// Re-export types for convenience
export type { EmailLabel, EmailMessage, EmailThread };
