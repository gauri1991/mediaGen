'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto">
          <span className="text-red-500 text-xl">!</span>
        </div>
        <div>
          <h2 className="font-semibold text-lg">Something went wrong</h2>
          <p className="text-sm text-neutral-500 mt-1">{error.message || 'An unexpected error occurred.'}</p>
        </div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={reset}>Try again</Button>
          <Link href="/dashboard"><Button variant="ghost">Dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
