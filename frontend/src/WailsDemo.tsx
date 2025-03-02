import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import { GreetService } from '../bindings/changeme';
// @ts-ignore
import { Events } from '@wailsio/runtime';

function WailsDemo() {
  const [name, setName] = useState('');
  const resultElementRef = useRef<HTMLDivElement>(null);
  const timeElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Direct implementation of the Wails3 demo code
    const unsubscribe = Events.On('time', (time: { data: string }) => {
      if (timeElementRef.current) {
        timeElementRef.current.innerText = time.data;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleGreet = () => {
    // Direct implementation of the Wails3 demo code
    GreetService.Greet(name)
      .then((result: string) => {
        if (resultElementRef.current) {
          resultElementRef.current.innerText = result;
        }
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  return (
    <div className='container mx-auto p-8 max-w-md'>
      <h1 className='text-3xl font-bold mb-6'>Wails3 Demo</h1>

      <div className='mb-8 p-6 bg-gray-100 rounded-lg shadow'>
        <h2 className='text-xl font-semibold mb-4'>Greet Service</h2>
        <div className='flex gap-2 mb-4'>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='Enter your name'
            className='flex-1 px-4 py-2 border rounded'
          />
          <button
            onClick={handleGreet}
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
          >
            Greet
          </button>
        </div>
        <div className='p-4 bg-white rounded border'>
          <p className='font-medium'>Result:</p>
          <div ref={resultElementRef}>Waiting for greeting...</div>
        </div>
      </div>

      <div className='p-6 bg-gray-100 rounded-lg shadow'>
        <h2 className='text-xl font-semibold mb-4'>Time Event</h2>
        <div className='p-4 bg-white rounded border'>
          <p className='font-medium'>Current Time:</p>
          <div ref={timeElementRef}>Waiting for time event...</div>
        </div>
      </div>
    </div>
  );
}

export default WailsDemo;
