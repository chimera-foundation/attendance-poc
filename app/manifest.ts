import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Absen Attendance',
    short_name: 'Absen',
    description: 'Geo-validated attendance tracking built with Next.js',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f9ff',
    theme_color: '#4648d4',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/globe.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
