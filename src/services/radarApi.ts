/**
 * Radar feed client. Replaces the old Express endpoints (/api/radar/*) so the
 * app runs standalone inside the Android WebView. Requests go straight to the
 * IDIGER/SIRE host; Capacitor's native HTTP layer (CapacitorHttp) makes these
 * calls without CORS restrictions.
 */

const RADAR_BASE = 'https://evp.sire.gov.co/radar_animate/datos';
const LIST_URL = `${RADAR_BASE}/lists/listado435.txt`;
const FRAME_BASE = `${RADAR_BASE}/radar_images/Transparente`;

export interface RadarFrame {
  id: string;
  filename: string;
  url: string;
  timeStr: string;
  dateTimeIso: string;
  label: string;
}

export const IDIGER_RADAR_BOUNDS: [[number, number], [number, number]] = [
  [4.137996, -74.65293], // south, west
  [5.2123413, -73.575005], // north, east
];

/** Bundled single-frame radar image, used when the live feed is unreachable. */
export const BUNDLED_RADAR_URL = '/data/radar/current_radar.png';

export async function fetchRadarFrames(): Promise<RadarFrame[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`${LIST_URL}?v=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const lines = text
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    return lines.map((line, idx) => {
      const filename = line.split('/').pop() || line;
      const m = filename.match(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
      let timeStr = '';
      let dateTimeIso = new Date().toISOString();
      if (m) {
        const [, yyyy, mm, dd, hh, min] = m;
        timeStr = `${hh}:${min}`;
        dateTimeIso = `${yyyy}-${mm}-${dd}T${hh}:${min}:00Z`;
      } else {
        timeStr = `-${(lines.length - 1 - idx) * 3}m`;
      }
      return {
        id: filename.replace('.png', ''),
        filename,
        url: `${FRAME_BASE}/${filename}`,
        timeStr,
        dateTimeIso,
        label: timeStr,
      };
    });
  } finally {
    clearTimeout(timeout);
  }
}
