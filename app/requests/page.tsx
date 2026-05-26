'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Shell from '../components/Shell';
import type { Balance, LeaveRequestRow, LeaveStatus, LeaveType } from '@/lib/leaves';

const TYPE_LABEL: Record<LeaveType, string> = {
  ANNUAL: 'Cuti Tahunan',
  SICK: 'Sakit',
  ALPHA: 'Alpha',
};

const STATUS_LABEL: Record<LeaveStatus, { label: string; cls: string }> = {
  PENDING: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Ditolak', cls: 'bg-rose-100 text-rose-700' },
  CANCELLED: { label: 'Dibatalkan', cls: 'bg-zinc-200 text-zinc-700' },
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<LeaveRequestRow[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();

  async function load() {
    setLoading(true);
    try {
      const [reqRes, balRes] = await Promise.all([
        fetch('/api/leave-requests'),
        fetch('/api/balance'),
      ]);
      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data.requests ?? []);
      }
      if (balRes.ok) {
        const data = await balRes.json();
        setBalance(data.balance ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function cancel(id: number) {
    if (!confirm('Batalkan pengajuan ini?')) return;
    start(async () => {
      const res = await fetch(`/api/leave-requests/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Pengajuan dibatalkan');
        load();
      } else {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error ?? 'Gagal membatalkan');
      }
    });
  }

  return (
    <Shell>
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="font-headline text-2xl font-semibold tracking-tight">Cuti</h1>
        <Link
          href="/requests/new"
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
        >
          + Pengajuan Baru
        </Link>
      </header>

      {balance ? (
        <section className="mb-6 grid grid-cols-2 gap-3">
          <BalanceCard
            label="Sisa Cuti Tahunan"
            remaining={balance.annual_remaining}
            total={balance.annual_total}
            pending={balance.annual_pending}
          />
          <BalanceCard
            label="Sisa Cuti Sakit"
            remaining={balance.sick_remaining}
            total={balance.sick_total}
            pending={balance.sick_pending}
          />
        </section>
      ) : null}

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-secondary">
          Riwayat Pengajuan
        </h2>
        {loading ? (
          <p className="rounded-2xl bg-white/70 p-4 text-center text-sm text-secondary">
            Memuat…
          </p>
        ) : requests.length === 0 ? (
          <p className="rounded-2xl bg-white/70 p-4 text-center text-sm text-secondary">
            Belum ada pengajuan. Klik &ldquo;Pengajuan Baru&rdquo; untuk memulai.
          </p>
        ) : (
          <ul className="space-y-2">
            {requests.map((r) => {
              const s = STATUS_LABEL[r.status];
              return (
                <li
                  key={r.id}
                  className="rounded-2xl bg-white/80 p-4 shadow-[0_4px_18px_rgba(70,72,212,0.06)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {TYPE_LABEL[r.type]} · {r.days_count} hari
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-secondary">
                        {r.starts_on === r.ends_on
                          ? r.starts_on
                          : `${r.starts_on} → ${r.ends_on}`}
                      </p>
                      {r.reason ? (
                        <p className="mt-1 text-xs text-on-surface">&ldquo;{r.reason}&rdquo;</p>
                      ) : null}
                      {r.decision_note ? (
                        <p className="mt-1 text-xs italic text-secondary">
                          Catatan admin: {r.decision_note}
                        </p>
                      ) : null}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                      {s.label}
                    </span>
                  </div>
                  {r.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => cancel(r.id)}
                      disabled={pending}
                      className="mt-3 text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                    >
                      Batalkan
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Shell>
  );
}

function BalanceCard({
  label,
  remaining,
  total,
  pending,
}: {
  label: string;
  remaining: number;
  total: number;
  pending: number;
}) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-[0_4px_18px_rgba(70,72,212,0.06)]">
      <p className="text-xs font-medium uppercase tracking-wide text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {remaining}
        <span className="ml-1 text-sm font-normal text-secondary">/ {total}</span>
      </p>
      {pending > 0 ? (
        <p className="mt-0.5 text-xs text-amber-700">{pending} menunggu</p>
      ) : (
        <p className="mt-0.5 text-xs text-transparent">·</p>
      )}
    </div>
  );
}
