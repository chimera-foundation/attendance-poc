'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, AttendanceLog } from '../context';
import { IconLoader, IconReceiptLong, IconPinDrop } from '../components/Icons';

export default function HistoryPage() {
  const router = useRouter();
  const { user, logs, loading } = useApp();
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


  const filteredLogs = React.useMemo(() => {
    if (filter === 'all') {
      return logs;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start on Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    return logs.filter(log => {
      // Use checkInISO to get the exact exact date
      const logDate = log.checkInISO ? new Date(log.checkInISO) : new Date(log.date);

      if (isNaN(logDate.getTime())) return true; // fallback if date is invalid

      if (filter === 'week') {
        return logDate >= startOfWeek;
      }

      if (filter === 'month') {
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
      }

      return true;
    });
  }, [filter, logs]);

  if (loading || !user) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <IconLoader className="w-9 h-9 text-primary animate-spin" />
      </div>
    );
  }

  const getStatusClasses = (status: AttendanceLog['status']) => {
    switch (status) {
      case 'On Time':
        return 'bg-emerald-50 border-emerald-100 text-emerald-700';
      case 'Late':
        return 'bg-amber-50 border-amber-100 text-amber-600';
      case 'Overtime':
        return 'bg-indigo-50 border-indigo-100 text-indigo-700';
      case 'Absent':
        return 'bg-rose-50 border-rose-100 text-rose-700';
      default:
        return 'bg-slate-50 border-slate-100 text-slate-700';
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full py-2">
      <div className="mb-6 select-none">
        <h1 className="font-headline text-[24px] font-semibold text-on-surface mb-1">
          Catatan Absensi
        </h1>
      </div>

      <div className="bg-white/80 p-1.5 rounded-2xl border border-slate-100/80 shadow-[0_4px_16px_rgba(70,72,212,0.02)] flex gap-1 mb-6 select-none">
        {(['all', 'week', 'month'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-300 capitalize outline-none ${filter === opt
              ? 'bg-primary text-on-primary shadow-[0_4px_12px_rgba(70,72,212,0.15)]'
              : 'text-secondary hover:text-on-surface'
              }`}
          >
            {opt === 'all' ? 'All Logs' : opt === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center select-none bg-white rounded-3xl p-6 border border-slate-100">
            <IconReceiptLong className="w-12 h-12 text-outline/30 mb-3" />
            <h3 className="font-headline text-base font-semibold text-on-surface">No logs found</h3>
            <p className="text-xs text-secondary mt-1 max-w-[180px]">
              Any future checked presence will appear right here.
            </p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={log.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(70,72,212,0.015)] flex justify-between items-center hover:shadow-[0_8px_24px_rgba(70,72,212,0.03)] transition-all duration-300"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 select-none">
                  <span className="font-headline text-sm font-semibold text-on-surface block">
                    {log.date}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-secondary font-medium select-none">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>In:</span>
                    <span className="font-bold text-on-surface">{log.checkIn}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span>Out:</span>
                    <span className="font-bold text-on-surface">{log.checkOut}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-xs font-bold font-mono text-on-surface bg-surface-container-low px-2 py-0.5 rounded-lg">
                  {log.hours}
                </span>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusClasses(log.status)}`}>
                  {log.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
