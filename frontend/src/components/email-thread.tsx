import { useEffect, useState } from 'react';
import { useGmailContext, EmailThread } from '@/contexts/gmail-context';
import { Button } from './ui/button';

interface EmailThreadViewProps {
  threadId: string;
}

export function EmailThreadView({ threadId }: EmailThreadViewProps) {
  const { loading, error, fetchThread } = useGmailContext();
  const [thread, setThread] = useState<EmailThread | null>(null);

  useEffect(() => {
    const loadThread = async () => {
      if (threadId) {
        const threadData = await fetchThread(threadId);
        if (threadData) {
          setThread(threadData);
        }
      }
    };

    loadThread();
  }, [threadId, fetchThread]);

  const handleRetry = () => {
    if (threadId) {
      fetchThread(threadId).then((threadData) => {
        if (threadData) {
          setThread(threadData);
        }
      });
    }
  };

  if (loading && !thread) {
    return (
      <div className='p-4 flex items-center justify-center h-full'>
        <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2'></div>
        <div>Loading thread...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 flex flex-col items-center justify-center h-full'>
        <div className='text-red-500 mb-4 text-center'>
          <p className='font-bold mb-2'>Error loading thread:</p>
          <p className='mb-4'>{error}</p>
          <Button onClick={handleRetry}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className='p-4 flex items-center justify-center h-full text-gray-500'>
        No thread selected
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <h2 className='text-xl font-bold p-4'>
        {thread.messages[0]?.subject || '(No subject)'}
      </h2>

      <div className='divide-y'>
        {thread.messages.map((message) => (
          <div key={message.id} className='p-4'>
            <div className='flex justify-between mb-2'>
              <div className='font-semibold'>{message.from}</div>
              <div className='text-sm text-gray-500'>{message.date}</div>
            </div>
            <div className='mt-2'>{message.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
