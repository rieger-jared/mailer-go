import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

// Types
export interface EmailLabel {
  id: string;
  name: string;
}

export interface EmailMessage {
  id: string;
  thread_id: string;
  snippet?: string;
  subject?: string;
  from?: string;
  date?: string;
  labels: string[];
}

export interface EmailThread {
  id: string;
  messages: EmailMessage[];
}

interface CommandResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useGmail() {
  const [labels, setLabels] = useState<EmailLabel[]>([]);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [currentEmail, setCurrentEmail] = useState<EmailMessage | null>(null);
  const [currentThread, setCurrentThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Gmail labels
  const fetchLabels = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<CommandResponse<EmailLabel[]>>(
        'fetch_gmail_labels'
      );

      if (response.success && response.data) {
        setLabels(response.data);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch emails
  const fetchEmails = async (maxResults?: number) => {
    setLoading(true);
    setError(null);
    console.log('Frontend: Starting fetchEmails with maxResults:', maxResults);

    try {
      console.log('Frontend: Invoking fetch_gmail_emails command');
      const response = await invoke<CommandResponse<EmailMessage[]>>(
        'fetch_gmail_emails',
        {
          max_results: maxResults,
        }
      );
      console.log(
        'Frontend: Received response from fetch_gmail_emails:',
        response
      );

      if (response.success && response.data) {
        console.log(
          'Frontend: Setting emails state with',
          response.data.length,
          'emails'
        );
        setEmails(response.data);
      } else if (response.error) {
        console.error('Frontend: Error from backend:', response.error);
        setError(response.error);
      } else {
        console.error('Frontend: No data and no error in response');
        setError('No data received from server');
      }
    } catch (err) {
      console.error('Frontend: Exception in fetchEmails:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      console.log('Frontend: Setting loading to false');
      setLoading(false);
    }
  };

  // Fetch a specific email
  const fetchEmail = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<CommandResponse<EmailMessage>>(
        'fetch_gmail_email',
        {
          id,
        }
      );

      if (response.success && response.data) {
        setCurrentEmail(response.data);
        return response.data;
      } else if (response.error) {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch a thread
  const fetchThread = async (threadId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await invoke<CommandResponse<EmailThread>>(
        'fetch_gmail_thread',
        {
          thread_id: threadId,
        }
      );

      if (response.success && response.data) {
        setCurrentThread(response.data);
        return response.data;
      } else if (response.error) {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    labels,
    emails,
    currentEmail,
    currentThread,
    loading,
    error,
    fetchLabels,
    fetchEmails,
    fetchEmail,
    fetchThread,
  };
}
