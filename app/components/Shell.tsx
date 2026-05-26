'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context';
import { IconFingerprint, IconHistory, IconPerson } from './Icons';

interface ShellProps {
  children: React.ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useApp();
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);

      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const isAuthPage = pathname === '/login' || pathname === '/register';

  const navItems = [
    { label: 'Home', icon: IconFingerprint, path: '/dashboard' },
    { label: 'Logs', icon: IconHistory, path: '/history' },
    { label: 'Leave', icon: IconPerson, path: '/requests' },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-full h-[100dvh] bg-background-custom flex flex-col items-center relative select-none z-0 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-[5%] -right-[5%] w-[55%] h-[30%] bg-surface-container-highest/30 rounded-full blur-3xl" style={{ animation: 'float 8s ease-in-out infinite reverse' }}></div>
      </div>
      <div className="w-full max-w-[480px] flex-1 flex flex-col pb-28 pt-6 px-5 min-h-0">
        {children}
      </div>
      {!isAuthPage && user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 px-4 pointer-events-none">
          <div className="w-full max-w-[480px] h-20 bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/30 shadow-[0_12px_40px_rgba(70,72,212,0.08)] flex items-center justify-around px-4 pointer-events-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl relative transition-all duration-300"
                >
                  <div
                    className={`absolute inset-0 bg-primary/10 rounded-2xl scale-75 blur-xs transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'
                      }`}
                  ></div>
                  <IconComponent
                    className={`w-[26px] h-[26px] transition-all duration-300 z-10 ${isActive ? 'text-primary scale-110' : 'text-secondary hover:text-primary/75'
                      }`}
                  />
                  <span
                    className={`text-[10px] font-sans font-medium mt-1 tracking-wide z-10 transition-all duration-300 ${isActive ? 'text-primary font-semibold' : 'text-secondary/60'
                      }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_#4648d4]"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isOffline && (
        <div className="fixed inset-0 z-[100] bg-background-custom/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <div className="w-20 h-20 bg-error-container/30 border border-error/10 text-error rounded-[28px] flex items-center justify-center mb-6 shadow-[0_8px_30px_rgba(186,26,26,0.12)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <h2 className="font-headline text-[22px] font-semibold text-on-surface mb-2">Tidak Ada Koneksi Internet</h2>
          <p className="text-body-md text-secondary max-w-[280px] leading-relaxed">
            Silakan periksa koneksi jaringan Anda. Anda tidak dapat mengakses aplikasi saat sedang offline.
          </p>
        </div>
      )}
    </div>
  );
}
