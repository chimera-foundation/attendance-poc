import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  computeBalance,
  countWorkdays,
  type HolidayRow,
  type LeaveRequestRow,
  type LeaveType,
} from '@/lib/leaves';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { type, starts_on, ends_on, reason } = (body ?? {}) as {
    type?: string;
    starts_on?: string;
    ends_on?: string;
    reason?: string | null;
  };

  if (type !== 'ANNUAL' && type !== 'SICK') {
    return NextResponse.json({ error: 'type must be ANNUAL or SICK' }, { status: 400 });
  }
  if (!starts_on || !DATE_RE.test(starts_on) || !ends_on || !DATE_RE.test(ends_on)) {
    return NextResponse.json({ error: 'starts_on/ends_on must be YYYY-MM-DD' }, { status: 400 });
  }
  if (ends_on < starts_on) {
    return NextResponse.json({ error: 'ends_on must be on/after starts_on' }, { status: 400 });
  }

  const [holidaysRes, settingsRes, overrideRes, existingRes] = await Promise.all([
    supabase
      .from('holidays')
      .select('id, name, starts_on, ends_on, kind, recurring, notes')
      .gte('ends_on', starts_on)
      .lte('starts_on', ends_on),
    supabase.from('leave_settings').select('*').eq('id', 1).single(),
    supabase.from('leave_quota_overrides').select('*').eq('user_id', user.id).maybeSingle(),
    supabase
      .from('leave_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['PENDING', 'APPROVED']),
  ]);

  if (settingsRes.error) {
    return NextResponse.json({ error: settingsRes.error.message }, { status: 500 });
  }

  const holidays = (holidaysRes.data ?? []) as HolidayRow[];
  const days = countWorkdays(starts_on, ends_on, holidays);
  if (days < 1) {
    return NextResponse.json(
      { error: 'Range contains no working days (weekends/holidays only).' },
      { status: 400 },
    );
  }

  const balance = computeBalance({
    defaults: {
      default_annual_days: settingsRes.data.default_annual_days,
      default_sick_days: settingsRes.data.default_sick_days,
    },
    override: overrideRes.data
      ? { annual_days: overrideRes.data.annual_days, sick_days: overrideRes.data.sick_days }
      : null,
    requests: (existingRes.data ?? []) as LeaveRequestRow[],
  });

  const remaining = type === 'ANNUAL' ? balance.annual_remaining : balance.sick_remaining;
  if (days > remaining) {
    return NextResponse.json(
      {
        error: `Insufficient ${type.toLowerCase()} leave: ${remaining} remaining, ${days} requested.`,
        balance,
      },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      user_id: user.id,
      type: type as LeaveType,
      starts_on,
      ends_on,
      days_count: days,
      reason: reason || null,
      status: 'PENDING',
    })
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ request: data }, { status: 201 });
}
