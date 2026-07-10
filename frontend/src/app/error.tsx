'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center max-w-md mx-auto">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-xl font-bold">
        ⚠️
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Something went wrong!</h2>
        <p className="text-zinc-400 text-sm">
          {error.message || 'An unexpected client error occurred.'}
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-border"
      >
        Try again
      </button>
    </div>
  );
}
