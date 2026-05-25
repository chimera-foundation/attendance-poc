export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function parseWkbPoint(wkb: string | any): { lat: number, lon: number } | null {
  if (!wkb) return null;
  
  if (typeof wkb === 'string') {
    try {
      // EWKB Point format typically 21 bytes (42 hex chars)
      // 01 01 00 00 20 E6 10 00 00 -> 9 bytes
      const hex = wkb.substring(18); 
      const b = Buffer.from(hex, 'hex');
      const lon = b.readDoubleLE(0);
      const lat = b.readDoubleLE(8);
      return { lat, lon };
    } catch (e) {
      console.error('Error parsing WKB', e);
      return null;
    }
  } else if (wkb.coordinates) {
    // GeoJSON fallback
    return { lat: wkb.coordinates[1], lon: wkb.coordinates[0] };
  }
  
  return null;
}
