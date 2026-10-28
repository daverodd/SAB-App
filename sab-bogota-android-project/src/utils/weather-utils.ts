export interface Station {
  IDSENSOR: number;
  IDESTACION: number;
  ESTACION: string;
  IDTIPOSENSOR: number;
  TIPOSENSOR: string;
  UNIDADMEDIDA: string;
  LATITUD: number;
  LONGITUD: number;
  ESTADO: number;
  IDTIPOTECNOLOGIA?: number;
  TIPOTECNOLOGIA?: string;
  IDLOCALIDAD?: number;
  LOCALIDAD: string;
  VISIBLE?: number;
  ACUMULADODIA: number;
  VALORLECTURA: number;
  FECHALECTURA: string;
  ALTITUD?: number;
}

export type RainCategory = "seco" | "llovizna" | "ligera" | "moderada" | "fuerte" | "torrencial";

export interface CategoryInfo {
  category: RainCategory;
  label: string;
  color: string;
  hex: string;
  iconName: string;
  range: string;
}

/**
 * Categorizes precipitation value into official IDIGER / SAB threshold levels.
 */
export function categorizeRainfall(mm: number): CategoryInfo {
  if (mm <= 0.1) {
    return {
      category: "seco",
      label: "Sin lluvia",
      color: "text-slate-400",
      hex: "#94a3b8",
      iconName: "TrianguloGris.png",
      range: "0 mm",
    };
  }
  if (mm < 5.0) {
    return {
      category: "llovizna",
      label: "Llovizna",
      color: "text-sky-400",
      hex: "#38bdf8",
      iconName: "TrianguloAzul.png",
      range: ">0 - 5 mm",
    };
  }
  if (mm < 15.0) {
    return {
      category: "ligera",
      label: "Lluvia ligera",
      color: "text-emerald-400",
      hex: "#34d399",
      iconName: "TrianguloVerde.png",
      range: "5 - 15 mm",
    };
  }
  if (mm < 30.0) {
    return {
      category: "moderada",
      label: "Lluvia moderada",
      color: "text-amber-400",
      hex: "#fbbf24",
      iconName: "TrianguloAmarillo.png",
      range: "15 - 30 mm",
    };
  }
  if (mm < 50.0) {
    return {
      category: "fuerte",
      label: "Lluvia fuerte",
      color: "text-orange-500",
      hex: "#f97316",
      iconName: "TrianguloNaranja.png",
      range: "30 - 50 mm",
    };
  }
  return {
    category: "torrencial",
    label: "Lluvia torrencial",
    color: "text-rose-500",
    hex: "#f43f5e",
    iconName: "TrianguloRojo.png",
    range: "> 50 mm",
  };
}

/**
 * Computes summary metrics across all Bogotá hydrometeorological stations.
 */
export function calculateStationStats(stations: Station[]) {
  if (!stations || stations.length === 0) {
    return {
      total: 0,
      active: 0,
      rainingCount: 0,
      maxAcumulado: 0,
      maxStation: null as Station | null,
      averageValue: 0,
      localitiesWithRain: [] as string[],
    };
  }

  let total = stations.length;
  let active = 0;
  let rainingCount = 0;
  let maxAcumulado = 0;
  let maxStation: Station | null = null;
  let sumValue = 0;
  const localitiesSet = new Set<string>();

  for (const s of stations) {
    if (s.ESTADO === 1) active++;
    const val = s.VALORLECTURA ?? 0;
    const acum = s.ACUMULADODIA ?? 0;

    sumValue += val;

    if (val > 0.1 || acum > 0.1) {
      rainingCount++;
      if (s.LOCALIDAD) {
        localitiesSet.add(s.LOCALIDAD.trim());
      }
    }

    if (acum > maxAcumulado) {
      maxAcumulado = acum;
      maxStation = s;
    }
  }

  return {
    total,
    active,
    rainingCount,
    maxAcumulado: Math.round(maxAcumulado * 10) / 10,
    maxStation,
    averageValue: Math.round((sumValue / (total || 1)) * 10) / 10,
    localitiesWithRain: Array.from(localitiesSet),
  };
}

/**
 * Calculates Haversine distance in kilometers between two geo coordinates.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Finds the nearest station to a given GPS coordinate.
 */
export function findNearestStation(
  userLat: number,
  userLon: number,
  stations: Station[]
): { station: Station; distanceKm: number } | null {
  if (!stations || stations.length === 0) return null;

  let minDistance = Infinity;
  let nearest: Station | null = null;

  for (const s of stations) {
    if (typeof s.LATITUD === "number" && typeof s.LONGITUD === "number") {
      const dist = haversineDistance(userLat, userLon, s.LATITUD, s.LONGITUD);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = s;
      }
    }
  }

  return nearest ? { station: nearest, distanceKm: minDistance } : null;
}

/**
 * Formats station observation date nicely (e.g. "12:56:00" or "Hoy 12:56").
 */
export function formatObservationTime(dateStr?: string): string {
  if (!dateStr) return "--:--";
  try {
    // Expected format e.g. "2026-10-27 12:56:00.0"
    const parts = dateStr.split(" ");
    if (parts.length >= 2) {
      const timePart = parts[1].split(".")[0];
      const [h, m] = timePart.split(":");
      return `${h}:${m}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    }
  } catch {
    // fallback
  }
  return dateStr;
}
