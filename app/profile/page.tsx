'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../context';
import {
  IconLoader,
  IconVerified,
  IconIdCard,
  IconContentCopy,
  IconDone,
  IconLogout,
} from '../components/Icons';
import type { Balance } from '@/lib/leaves';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loading } = useApp();

  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(false);
  const [balance, setBalance] = useState<Balance | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/balance')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBalance(d?.balance ?? null))
      .catch(() => setBalance(null));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <IconLoader className="w-9 h-9 text-primary animate-spin" />
      </div>
    );
  }


  return (
    <div className="flex flex-col flex-1 h-full py-2">
      <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_24px_rgba(70,72,212,0.02)] border border-slate-100 flex flex-col items-center text-center mb-6 relative select-none">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden shadow-[0px_6px_20px_rgba(70,72,212,0.12)] border-4 border-white bg-slate-100">
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          </div>
        </div>

        <h2 className="font-headline text-lg font-semibold text-on-surface leading-tight">
          {user.name}
        </h2>
        <span className="text-sm text-secondary mt-0.5 block">
          {user.email}
        </span>
      </div>

      <div className="space-y-4">
        {balance ? (
          <Link
            href="/requests"
            className="block w-full bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_4px_18px_rgba(70,72,212,0.04)] hover:shadow-[0_6px_22px_rgba(70,72,212,0.08)] transition"
          >
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-secondary">
                Cuti {balance.year}
              </span>
              <span className="text-xs text-primary">Lihat semua →</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-secondary">Tahunan</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums">
                  {balance.annual_remaining}
                  <span className="ml-1 text-xs font-normal text-secondary">/ {balance.annual_total}</span>
                </p>
                {balance.annual_pending > 0 ? (
                  <p className="text-[10px] text-amber-700">{balance.annual_pending} menunggu</p>
                ) : null}
              </div>
              <div>
                <p className="text-xs text-secondary">Sakit</p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums">
                  {balance.sick_remaining}
                  <span className="ml-1 text-xs font-normal text-secondary">/ {balance.sick_total}</span>
                </p>
                {balance.sick_pending > 0 ? (
                  <p className="text-[10px] text-amber-700">{balance.sick_pending} menunggu</p>
                ) : null}
              </div>
            </div>
          </Link>
        ) : null}

        <div className="pt-2">
          <div className="w-full bg-primary/5 border border-primary/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-primary font-bold tracking-wider uppercase mb-1">Device Secured</span>
            <span className="text-xs text-secondary">This device is securely locked to {user.name}&apos;s identity to prevent buddy punching.</span>
          </div>
        </div>

        {/* <div className="pt-4">
          <button
            onClick={logout}
            className="w-full h-12 bg-white text-error border border-error/15 hover:bg-error/5 active:scale-98 transition-all font-semibold rounded-2xl text-button-text flex items-center justify-center gap-2 outline-none shadow-sm shadow-error/5 relative overflow-hidden group"
          >
            <IconLogout className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div> */}
      </div>
    </div>
  );
}
