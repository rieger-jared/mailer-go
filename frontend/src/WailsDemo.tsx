import { useState, useEffect, useRef } from 'react';
import { GreetService, Person } from '../bindings/changeme';
import { Events } from '@wailsio/runtime';
import DarkModeToggle from './components/DarkModeToggle';

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

  const handleGreet = async () => {
    // Direct implementation of the Wails3 demo code
    try {
      const person: Person = {
        name: name,
        age: 3,
        address: null,
      };
      const result = await GreetService.Greet(person);
      if (resultElementRef.current) {
        resultElementRef.current.innerText = result;
      }
    } catch (error) {
      console.log(error);
      if (resultElementRef.current) {
        resultElementRef.current.innerText = `Error: ${error}`;
      }
    }
  };

  return (
    <div className='min-h-screen transition-colors duration-200 dark:bg-gray-900'>
      <div className='container mx-auto p-8 max-w-md dark:text-white'>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-3xl font-bold'>Wails3 Demo</h1>
          <DarkModeToggle />
        </div>

        <div className='mb-8 p-6 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md transition-colors duration-200'>
          <h2 className='text-xl font-semibold mb-4'>Greet Service</h2>
          <div className='flex gap-2 mb-4'>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Enter your name'
              className='flex-1 px-4 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400'
            />
            <button
              onClick={handleGreet}
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 dark:bg-blue-600 dark:hover:bg-blue-700'
            >
              Greet
            </button>
            <p
              className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 dark:bg-blue-600 dark:hover:bg-blue-700'
              wml-event='button-pressed'
            >
              Emit event
            </p>
          </div>
          <div className='p-4 bg-white rounded border transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600'>
            <p className='font-medium mb-2'>Result:</p>
            <div ref={resultElementRef} className='min-h-6'>
              Waiting for greeting...
            </div>
          </div>
        </div>

        <div className='p-6 bg-gray-100 rounded-lg shadow-md transition-colors duration-200 dark:bg-gray-800'>
          <h2 className='text-xl font-semibold mb-4'>Time Event</h2>
          <div className='p-4 bg-white rounded border transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600'>
            <p className='font-medium mb-2'>Current Time:</p>
            <div ref={timeElementRef} className='min-h-6'>
              Waiting for time event...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WailsDemo;
