import { useEffect, useState } from 'react';
import { useGmailContext, EmailMessage } from '@/contexts/gmail-context';
import { EmailThreadView } from './email-thread';
import { Button } from './ui/button';

export function EmailList() {
  const { emails, loading, error, fetchEmails, fetchEmail } = useGmailContext();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  useEffect(() => {
    // Load emails when component mounts
    fetchEmails(20);
  }, [fetchEmails]);

  const handleEmailClick = async (id: string) => {
    setSelectedEmailId(id);

    // Find the email in the list to get its thread ID
    const email = emails.find((email) => email.id === id);
    if (email) {
      setSelectedThreadId(email.thread_id);
    } else {
      // If not found in the list, fetch it
      const emailData = await fetchEmail(id);
      if (emailData) {
        setSelectedThreadId(emailData.thread_id);
      }
    }
  };

  const handleRetry = () => {
    fetchEmails(20);
  };

  if (loading && emails.length === 0) {
    return (
      <div className='p-4 flex flex-col items-center justify-center h-full'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4'></div>
        <div>Loading emails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4 flex flex-col items-center justify-center h-full'>
        <div className='text-red-500 mb-4 text-center max-w-md'>
          <p className='font-bold mb-2'>Error loading emails:</p>
          <p className='mb-4'>{error}</p>

          {error.includes('placeholder') && (
            <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm mb-4'>
              <p className='font-semibold mb-2'>
                You need to set up your Google API credentials:
              </p>
              <ol className='list-decimal list-inside space-y-2 text-left'>
                <li>
                  Go to the{' '}
                  <a
                    href='https://console.cloud.google.com/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 hover:underline'
                  >
                    Google Cloud Console
                  </a>
                </li>
                <li>Create a new project</li>
                <li>Enable the Gmail API</li>
                <li>Create OAuth 2.0 credentials (Desktop application)</li>
                <li>
                  Download the credentials and create a{' '}
                  <code className='bg-gray-100 px-1 py-0.5 rounded'>
                    credentials.json
                  </code>{' '}
                  file with the following structure:
                  <pre className='bg-gray-100 p-2 mt-1 rounded overflow-x-auto text-xs'>
                    {`{
  "type": "authorized_user",
  "client_id": "your-client-id.apps.googleusercontent.com",
  "client_secret": "your-client-secret",
  "refresh_token": "your-refresh-token"
}`}
                  </pre>
                </li>
                <li>
                  Run{' '}
                  <code className='bg-gray-100 px-1 py-0.5 rounded'>
                    bun run setup-gmail
                  </code>{' '}
                  to copy the credentials to the config directory
                </li>
              </ol>
            </div>
          )}

          {error.includes('refresh_token is empty') && (
            <div className='bg-yellow-50 border border-yellow-200 p-4 rounded-md text-sm mb-4'>
              <p className='font-semibold mb-2'>
                Your credentials.json file is missing the refresh token:
              </p>
              <p>
                You need to obtain a refresh token for your Google account and
                add it to the credentials.json file.
              </p>
            </div>
          )}

          <Button onClick={handleRetry} className='mt-2'>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full'>
      <div className='w-1/3 border-r overflow-auto'>
        <h2 className='text-xl font-bold p-4'>Emails</h2>

        {emails.length === 0 ? (
          <div className='p-4'>No emails found</div>
        ) : (
          <div className='divide-y'>
            {emails.map((email) => (
              <div
                key={email.id}
                className={`p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedEmailId === email.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => handleEmailClick(email.id)}
              >
                <div className='font-semibold'>
                  {email.subject || '(No subject)'}
                </div>
                <div className='text-sm text-gray-600'>{email.from}</div>
                <div className='text-sm text-gray-500'>{email.date}</div>
                <div className='mt-2 text-sm text-gray-700 line-clamp-2'>
                  {email.snippet}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='w-2/3 overflow-auto'>
        {selectedThreadId ? (
          <EmailThreadView threadId={selectedThreadId} />
        ) : (
          <div className='flex items-center justify-center h-full text-gray-500'>
            Select an email to view the conversation
          </div>
        )}
      </div>
    </div>
  );
}
