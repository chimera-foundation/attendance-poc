import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computeBalance, type LeaveRequestRow } from '@/lib/leaves';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [settingsRes, overrideRes, requestsRes] = await Promise.all([
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
  if (requestsRes.error) {
    return NextResponse.json({ error: requestsRes.error.message }, { status: 500 });
  }

  const balance = computeBalance({
    defaults: {
      default_annual_days: settingsRes.data.default_annual_days,
      default_sick_days: settingsRes.data.default_sick_days,
    },
    override: overrideRes.data
      ? { annual_days: overrideRes.data.annual_days, sick_days: overrideRes.data.sick_days }
      : null,
    requests: (requestsRes.data ?? []) as LeaveRequestRow[],
  });

  return NextResponse.json({ balance });
}
