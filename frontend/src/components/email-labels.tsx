import { useEffect } from 'react';
import { useGmailContext } from '@/contexts/gmail-context';
import { Button } from './ui/button';

export function EmailLabels() {
  const { labels, loading, error, fetchLabels } = useGmailContext();

  useEffect(() => {
    // Load labels when component mounts
    fetchLabels();
  }, [fetchLabels]);

  const handleRetry = () => {
    fetchLabels();
  };

  if (loading && labels.length === 0) {
    return (
      <div className='p-4 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2'></div>
        <div>Loading labels...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-4'>
        <div className='text-red-500 text-sm mb-2'>Error loading labels</div>
        <Button onClick={handleRetry} size='sm' variant='outline'>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col'>
      <h2 className='text-xl font-bold p-4'>Labels</h2>

      {labels.length === 0 ? (
        <div className='p-4'>No labels found</div>
      ) : (
        <div className='space-y-1 p-2'>
          {labels.map((label) => (
            <div
              key={label.id}
              className='px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer'
            >
              {label.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
