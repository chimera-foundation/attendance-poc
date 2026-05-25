'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context';
import {
  IconLoader,
  IconLocationOn,
  IconSchedule,
  IconTrendingUp,
  IconDoneAll,
  IconFingerprint,
  IconHourglass,
  IconVerified,
  IconExitToApp,
  IconSync,
  IconCheckCircle,
  IconRadioUnchecked,
  IconDone,
} from '../components/Icons';

export default function DashboardPage() {
  const router = useRouter();
  const { user, currentSession, checkIn, checkOut, logs, loading } = useApp();

  const [simulatingGps, setSimulatingGps] = useState(false);
  const [showConfirmCheckOut, setShowConfirmCheckOut] = useState(false);
  const [isCheckOutSubmitting, setIsCheckOutSubmitting] = useState(false);
  const [timerString, setTimerString] = useState('00h 00m 00s');

  const timerRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (!loading && !user) {
      const t = setTimeout(() => {
        router.push('/login');
      }, 100);
      return () => clearTimeout(t);
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (!currentSession) {
      const timer = setTimeout(() => {
        setTimerString('00h 00m 00s');
      }, 0);
      return () => clearTimeout(timer);
    }

    const updateTimer = () => {
      const start = new Date(currentSession.checkInTime).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;

      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);

      const hrsStr = hrs.toString().padStart(2, '0');
      const minsStr = mins.toString().padStart(2, '0');
      const secsStr = secs.toString().padStart(2, '0');

      setTimerString(`${hrsStr}h ${minsStr}m ${secsStr}s`);
    };

    const timer = setTimeout(updateTimer, 0);
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentSession]);

  if (loading || !user) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <IconLoader className="w-9 h-9 text-primary animate-spin" />
      </div>
    );
  }


  const handleCheckIn = async () => {
    setSimulatingGps(true);
    await checkIn();
    setSimulatingGps(false);
  };

  const handleCheckOut = async () => {
    setIsCheckOutSubmitting(true);
    await checkOut();
    setIsCheckOutSubmitting(false);
    setShowConfirmCheckOut(false);
  };


  const totalLogs = logs.length;
  const onTimeLogs = logs.filter(l => l.status === 'On Time' || l.status === 'Overtime').length;
  const onTimeRate = totalLogs > 0 ? Math.round((onTimeLogs / totalLogs) * 100) : 100;




  return (
    <div className="flex flex-col flex-1 h-full py-2">
      <div className="flex justify-between items-center mb-6 select-none">
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[11px] font-bold text-outline tracking-wider block uppercase">Welcome back</span>
            <span className="font-headline text-[18px] font-semibold text-on-surface leading-tight block">{user.name}</span>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] border ${currentSession
          ? 'bg-tertiary-container/10 border-tertiary/10 text-tertiary'
          : 'bg-secondary-container/20 border-secondary/10 text-secondary'
          }`}>
          <span className={`w-2 h-2 rounded-full ${currentSession ? 'bg-tertiary animate-pulse' : 'bg-secondary'}`}></span>
          <span>{currentSession ? 'On Duty' : 'Off Duty'}</span>
        </div>
      </div>

      <div className="bg-white rounded-[28px] p-6 shadow-[0_10px_35px_rgba(70,72,212,0.05)] border border-slate-100/50 flex flex-col items-center text-center flex-1 justify-center relative overflow-hidden">

        {!currentSession ? (

          <div className="flex flex-col items-center flex-1 justify-center py-6 w-full relative">
            <div className="relative mb-8 select-none">
              <div className="absolute inset-0 bg-tertiary/10 rounded-full scale-125 animate-pulse-ring"></div>
              <div className="absolute inset-0 bg-tertiary/20 rounded-full scale-110 animate-pulse-ring" style={{ animationDelay: '0.5s' }}></div>

              <button
                onClick={handleCheckIn}
                className="relative w-28 h-28 rounded-full bg-tertiary text-on-tertiary shadow-[0_12px_32px_rgba(0,108,73,0.3)] active:scale-95 hover:bg-tertiary-container transition-all duration-300 flex items-center justify-center outline-none group"
              >
                <IconFingerprint className="w-12 h-12 text-white transition-transform duration-500 group-hover:rotate-12" />
              </button>
            </div>

            <h2 className="font-headline text-[20px] font-semibold text-on-surface leading-snug mb-1">
              Ready to Check In
            </h2>
          </div>
        ) : (

          <div className="flex flex-col items-center flex-1 justify-center py-6 w-full">
            <div className="relative mb-6 select-none">
              <div className="absolute inset-0 bg-error/10 rounded-full scale-125 animate-pulse-ring"></div>

              <div className="w-24 h-24 rounded-full bg-white ring-4 ring-primary-container shadow-[0_12px_24px_rgba(70,72,212,0.1)] flex items-center justify-center">
                <IconHourglass className="w-[38px] h-[38px] text-primary animate-pulse" />
              </div>
            </div>

            <span className="text-[11px] font-bold text-outline tracking-wider block uppercase mb-1">ACTIVE SESSION DURATION</span>
            <div className="text-[28px] font-bold text-on-surface tracking-tight font-mono block leading-none mb-2">
              {timerString}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-low border border-slate-100 rounded-full text-xs font-medium text-secondary mb-8 select-none">
              <span>Checked in at {new Date(currentSession.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>

            <button
              onClick={() => setShowConfirmCheckOut(true)}
              className="px-6 h-12 bg-white text-error border-2 border-error/20 hover:border-error hover:bg-error/5 active:scale-95 transition-all duration-200 font-semibold rounded-2xl text-button-text flex items-center justify-center gap-2 outline-none shadow-sm"
            >
              <IconExitToApp className="w-5 h-5" />
              <span>Trigger Check-Out</span>
            </button>
          </div>
        )}
      </div>

      {simulatingGps && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white z-50 transition-all select-none">
          <IconLoader className="w-12 h-12 text-primary animate-spin mb-4" />
          <h3 className="font-headline text-[18px] font-semibold text-white tracking-tight">
            Checking In...
          </h3>
        </div>
      )}

      {showConfirmCheckOut && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-end z-50 overflow-hidden select-none">
          <div className="w-full bg-white rounded-t-[32px] p-6 shadow-[0_-12px_45px_rgba(0,0,0,0.15)] space-y-5 animate-slide-up">

            <div className="text-center">
              <div className="w-12 h-12 bg-error-container/30 border border-error/10 text-error rounded-2xl inline-flex items-center justify-center mb-3">
                <IconExitToApp className="w-6 h-6" />
              </div>
              <h3 className="font-headline text-[18px] font-semibold text-on-surface">Akhiri Sesi Kerja?</h3>
              <p className="text-body-md text-secondary leading-relaxed max-w-[250px] mx-auto mt-1">
                Kehadiran Anda akan dicatat ke dalam sistem log absensi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowConfirmCheckOut(false)}
                className="h-12 bg-surface text-secondary font-semibold rounded-2xl active:scale-98 transition-all hover:bg-slate-100 outline-none"
                disabled={isCheckOutSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCheckOut}
                className="h-12 bg-error text-on-error hover:bg-error-container font-semibold rounded-2xl active:scale-98 transition-all shadow-[0px_6px_14px_rgba(186,26,26,0.2)] flex items-center justify-center gap-1.5 outline-none"
                disabled={isCheckOutSubmitting}
              >
                {isCheckOutSubmitting ? (
                  <IconLoader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Confirm</span>
                    <IconDone className="w-[18px] h-[18px]" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
