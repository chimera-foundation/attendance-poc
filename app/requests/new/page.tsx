'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Shell from '../../components/Shell';
import type { LeaveType } from '@/lib/leaves';

export default function NewRequestPage() {
  const router = useRouter();
  const [type, setType] = useState<LeaveType>('ANNUAL');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          starts_on: startsOn,
          ends_on: endsOn || startsOn,
          reason: reason || null,
        }),
      });
      if (res.ok) {
        toast.success('Pengajuan terkirim');
        router.replace('/requests');
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Pengajuan gagal');
      }
    });
  }

  return (
    <Shell>
      <header className="mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs text-secondary hover:underline"
        >
          ← Kembali
        </button>
        <h1 className="mt-1 font-headline text-2xl font-semibold tracking-tight">
          Pengajuan Baru
        </h1>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl bg-white/80 p-5 shadow-[0_4px_18px_rgba(70,72,212,0.06)]"
      >
        <fieldset>
          <legend className="mb-2 text-xs font-medium uppercase tracking-wide text-secondary">
            Jenis
          </legend>
          <div className="grid grid-cols-2 gap-2">
            <TypeOption
              checked={type === 'ANNUAL'}
              onSelect={() => setType('ANNUAL')}
              label="Cuti Tahunan"
            />
            <TypeOption
              checked={type === 'SICK'}
              onSelect={() => setType('SICK')}
              label="Sakit"
            />
          </div>
        </fieldset>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-secondary">
            Mulai
          </span>
          <input
            type="date"
            required
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-secondary">
            Selesai (kosongkan untuk 1 hari)
          </span>
          <input
            type="date"
            value={endsOn}
            onChange={(e) => setEndsOn(e.target.value)}
            min={startsOn || undefined}
            className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium uppercase tracking-wide text-secondary">
            Keterangan (opsional)
          </span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              type === 'SICK' ? 'mis. demam, perlu istirahat' : 'mis. acara keluarga'
            }
            className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || !startsOn}
          className="w-full rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Mengirim…' : 'Kirim Pengajuan'}
        </button>
      </form>
    </Shell>
  );
}

function TypeOption({
  checked,
  onSelect,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
        checked
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-zinc-200 bg-white text-secondary hover:border-primary/30'
      }`}
    >
      {label}
    </button>
  );
}
