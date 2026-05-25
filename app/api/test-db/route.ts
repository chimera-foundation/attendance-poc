import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('geofences').select('*').limit(1);
  return NextResponse.json({ data, error });
}
