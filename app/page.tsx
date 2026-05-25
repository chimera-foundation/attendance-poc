'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './context';
import { IconLoader } from './components/Icons';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useApp();

  useEffect(() => {
    if (!loading) {
      const timeoutId = setTimeout(() => {
        if (user) {
          router.replace('/dashboard');
        } else {
          router.replace('/login');
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, router]);

  console.log(loading)
  console.log(user)
  return (
    <div className="flex flex-1 items-center justify-center min-h-[300px]">
      <div className="flex flex-col items-center gap-3">
        <IconLoader className="w-[42px] h-[42px] text-primary animate-spin" />
        <span className="text-secondary text-sm font-medium tracking-wide">Loading...</span>
      </div>
    </div>
  );
}
