import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('user_id', userId)
      .not('clock_out_at', 'is', null) 
      .order('clock_in_at', { ascending: false });

    if (error) {
      console.error('History fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const formattedLogs = data.map((log: any) => {
      const checkInDate = new Date(log.clock_in_at);
      const checkOutDate = new Date(log.clock_out_at);
      // Status and hours are now computed on the client side
      // Passing dummy values here, and adding raw ISO strings so the client can compute
      const hoursStr = '';
      const status = 'On Time';

      const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false };
      const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' };

      return {
        id: `log-${log.id}`,
        db_id: log.id,
        date: checkOutDate.toLocaleDateString('en-US', dateOptions),
        checkIn: checkInDate.toLocaleTimeString('en-US', options),
        checkOut: checkOutDate.toLocaleTimeString('en-US', options),
        hours: hoursStr,
        status,
        checkInISO: log.clock_in_at,
        checkOutISO: log.clock_out_at,
        location: log.geofences ? log.geofences.site_name : 'Geofence', 
      };
    });

    return NextResponse.json({ logs: formattedLogs }, { status: 200 });

  } catch (error: any) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
