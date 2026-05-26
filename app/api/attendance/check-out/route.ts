import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { logId, latitude, longitude } = await request.json();

    if (!logId || !latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: geofences, error: geofenceError } = await supabase
      .from('geofences')
      .select('id, site_name, location, radius_meters');

    if (geofenceError || !geofences || geofences.length === 0) {
      return NextResponse.json({ error: 'Geofence not found' }, { status: 404 });
    }

    const { parseWkbPoint, getDistanceInMeters } = await import('@/lib/geolocation');
    
    let matchedGeofence = null;
    let minDistance = Infinity;

    for (const gf of geofences) {
      const gfCoords = parseWkbPoint(gf.location);
      if (gfCoords) {
        const distance = getDistanceInMeters(latitude, longitude, gfCoords.lat, gfCoords.lon);
        if (distance <= gf.radius_meters && distance < minDistance) {
          minDistance = distance;
          matchedGeofence = { ...gf, distance };
        }
      }
    }

    if (!matchedGeofence) {
      return NextResponse.json({ error: 'Anda harus berada di sekitar kantor untuk melakukan absen' }, { status: 403 });
    }

    const geofenceId = matchedGeofence.id;
    const distance = matchedGeofence.distance;

    const { data, error } = await supabase.from('attendance_logs').update({
      geofence_out_id: geofenceId,
      user_location_out: `POINT(${longitude} ${latitude})`,
      clock_out_at: new Date().toISOString(),
      is_out_within_geofence: true,
      distance_out_meters: distance
    }).eq('id', logId).select('*').single();

    if (error) {
      console.error('Check-out db error:', error);
      return NextResponse.json({ error: error.message || 'Check-out failed' }, { status: 400 });
    }

    
    const checkInDate = new Date(data.clock_in_at);
    const checkOutDate = new Date(data.clock_out_at);
    const hoursStr = '';
    const status = 'On Time';

    const options: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false };
    const dateOptions: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric' };

    return NextResponse.json({
      log: {
        id: `log-${data.id}`,
        db_id: data.id,
        date: checkOutDate.toLocaleDateString('en-US', dateOptions),
        checkIn: checkInDate.toLocaleTimeString('en-US', options),
        checkOut: checkOutDate.toLocaleTimeString('en-US', options),
        hours: hoursStr,
        status,
        checkInISO: data.clock_in_at,
        checkOutISO: data.clock_out_at,
        location: matchedGeofence.site_name || 'Geofence', 
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Check-out API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
