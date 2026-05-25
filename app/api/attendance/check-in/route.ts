import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { latitude, longitude } = await request.json();

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = user.id;

    
    
    
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

    const { data, error } = await supabase.from('attendance_logs').insert({
      user_id: userId,
      geofence_in_id: geofenceId,
      user_location_in: `POINT(${longitude} ${latitude})`,
      clock_in_at: new Date().toISOString(),
      is_in_within_geofence: true,
      distance_in_meters: distance
    }).select('*').single();

    if (error) {
      console.error('Check-in db error:', error);
      return NextResponse.json({ error: error.message || 'Check-in failed' }, { status: 400 });
    }

    return NextResponse.json({
      session: {
        id: data.id,
        checkInTime: data.clock_in_at,
        zone: matchedGeofence.site_name || 'Geofence', 
        verified: data.is_in_within_geofence
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Check-in API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
