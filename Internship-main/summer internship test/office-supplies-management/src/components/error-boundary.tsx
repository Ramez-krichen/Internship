'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Check if it's an RSC-related error
      if (
        event.reason?.message?.includes('_rsc') ||
        event.reason?.message?.includes('aborted') ||
        event.reason?.toString().includes('net::ERR_ABORTED')
      ) {
        event.preventDefault();
        setHasError(true);
      }
    };

    // Handle errors
    const handleError = (event: ErrorEvent) => {
      console.error('Error event:', event.error);
      
      // Check if it's an RSC-related error
      if (
        event.error?.message?.includes('_rsc') ||
        event.error?.message?.includes('aborted') ||
        event.error?.toString().includes('net::ERR_ABORTED')
      ) {
        event.preventDefault();
        setHasError(true);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  // Reset error state and retry
  const handleRetry = () => {
    setHasError(false);
    // Refresh the current page without RSC parameters
    const url = new URL(window.location.href);
    url.searchParams.delete('_rsc');
    router.push(url.pathname + url.search);
  };

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong</h2>
            <p className="mt-2 text-gray-600">
              We encountered an error while loading this page.
            </p>
            <button
              onClick={handleRetry}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}