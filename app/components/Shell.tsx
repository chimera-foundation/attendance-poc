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

  const isAuthPage = pathname === '/login' || pathname === '/register';

  const navItems = [
    { label: 'Home', icon: IconFingerprint, path: '/dashboard' },
    { label: 'Logs', icon: IconHistory, path: '/history' },
    // { label: 'Profile', icon: IconPerson, path: '/profile' },
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
    </div>
  );
}
