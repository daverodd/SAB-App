/**
 * SAB (Sistema de Alerta de Bogotá) Business Logic & Utilities
 */

export interface Station {
  IDSENSOR: number;
  IDESTACION?: number | null;
  ESTACION?: string | null;
  IDTIPOSENSOR?: number;
  TIPOSENSOR?: string;
  UNIDADMEDIDA?: string;
  LATITUD?: number | null;
  LONGITUD?: number | null;
  ESTADO?: number;
  IDTIPOTECNOLOGIA?: number;
  TIPOTECNOLOGIA?: string;
  IDLOCALIDAD?: number;
  LOCALIDAD?: string;
  VISIBLE?: number;
  ACUMULADODIA?: number | null;
  VALORLECTURA?: number | null;
  FECHALECTURA?: string | null;
  ALTITUD?: number | null;
  CODIGO?: string | null;
  GEOLOGIA?: string | null;
  IDESTADOSSISMOS?: number | null;
  ESTADOESTACION?: number | null;
  PRESIONATMOSFERICA?: number | null;
  HUMEDAD?: number | null;
  IDNIVELES?: number | null;
  VELOCIDAD?: number | null;
  [key: string]: any;
}

export interface ReadingItem {
  FECHALECTURA: string;
  VALORLECTURA: number;
  CANTIDAD_MINUTOS: number;
  ESTADO_INTERVALO: string;
}

export type RainCategoryKey = 'none' | 'low' | 'moderate' | 'high' | 'very_high';

export interface RainCategoryInfo {
  key: RainCategoryKey;
  label: string;
  rangeLabel: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  borderColor: string;
  iconSrc: string;
}

export const RAIN_CATEGORIES: Record<RainCategoryKey, RainCategoryInfo> = {
  none: {
    key: 'none',
    label: 'Sin Lluvias',
    rangeLabel: '0.0 mm',
    min: 0,
    max: 0,
    color: '#808080',
    bgColor: '#f3f4f6',
    borderColor: '#9ca3af',
    iconSrc: '/sab-assets/TrianguloGris.png',
  },
  low: {
    key: 'low',
    label: 'Acumulados Bajos',
    rangeLabel: '0.1 - 10 mm',
    min: 0.001,
    max: 10,
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#60a5fa',
    iconSrc: '/sab-assets/TrianguloAzul.png',
  },
  moderate: {
    key: 'moderate',
    label: 'Acumulados Moderados',
    rangeLabel: '10.1 - 30 mm',
    min: 10.001,
    max: 30,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#4ade80',
    iconSrc: '/sab-assets/TrianguloVerde.png',
  },
  high: {
    key: 'high',
    label: 'Acumulados Altos',
    rangeLabel: '30.1 - 50 mm',
    min: 30.001,
    max: 50,
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fb923c',
    iconSrc: '/sab-assets/TrianguloNaranja.png',
  },
  very_high: {
    key: 'very_high',
    label: 'Acumulados Muy Altos',
    rangeLabel: '> 50 mm',
    min: 50.001,
    max: 9999,
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#a78bfa',
    iconSrc: '/sab-assets/TrainguloMorado.png',
  },
};

/**
 * Official SAB Temperature Scale & Categories
 * (matching https://app.sab.gov.co/sab/temperatura.htm?boton_menu=1)
 */
export type TempCategoryKey = 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7';

export interface TempCategoryInfo {
  key: TempCategoryKey;
  label: string;
  rangeLabel: string;
  min: number;
  max: number;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  iconSrc: string;
}

export const TEMP_CATEGORIES: Record<TempCategoryKey, TempCategoryInfo> = {
  t1: {
    key: 't1',
    label: 'Helada / Muy Frío',
    rangeLabel: '-2°C - 2°C',
    min: -50,
    max: 2.0,
    color: '#1e3a8a',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    textColor: '#ffffff',
    iconSrc: '/sab-assets/11.png',
  },
  t2: {
    key: 't2',
    label: 'Frío Intenso',
    rangeLabel: '2.1°C - 6°C',
    min: 2.001,
    max: 6.0,
    color: '#2563eb',
    bgColor: '#eff6ff',
    borderColor: '#60a5fa',
    textColor: '#ffffff',
    iconSrc: '/sab-assets/12.png',
  },
  t3: {
    key: 't3',
    label: 'Frío Moderado',
    rangeLabel: '6.1°C - 10°C',
    min: 6.001,
    max: 10.0,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#38bdf8',
    textColor: '#ffffff',
    iconSrc: '/sab-assets/13.png',
  },
  t4: {
    key: 't4',
    label: 'Templado Frío',
    rangeLabel: '10.1°C - 14°C',
    min: 10.001,
    max: 14.0,
    color: '#0d9488',
    bgColor: '#f0fdfa',
    borderColor: '#2dd4bf',
    textColor: '#ffffff',
    iconSrc: '/sab-assets/14.png',
  },
  t5: {
    key: 't5',
    label: 'Templado',
    rangeLabel: '14.1°C - 18°C',
    min: 14.001,
    max: 18.0,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#4ade80',
    textColor: '#ffffff',
    iconSrc: '/sab-assets/15.png',
  },
  t6: {
    key: 't6',
    label: 'Cálido',
    rangeLabel: '18.1°C - 22°C',
    min: 18.001,
    max: 22.0,
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fb923c',
    textColor: '#ffffff',
    iconSrc: '/sab-assets/16.png',
  },
  t7: {
    key: 't7',
    label: 'Muy Cálido',
    rangeLabel: '22.1°C - 26°C+',
    min: 22.001,
    max: 50.0,
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#f87171',
    textColor: '#ffffff',
    iconSrc: '/sab-assets/17.png',
  },
};

/**
 * Classify a rainfall reading into official SAB category
 */
export function classifyRainfall(accumulatedMm: number | null | undefined): RainCategoryInfo {
  const val = Number(accumulatedMm) || 0;
  if (val <= 0.05) return RAIN_CATEGORIES.none;
  if (val <= 10.0) return RAIN_CATEGORIES.low;
  if (val <= 30.0) return RAIN_CATEGORIES.moderate;
  if (val <= 50.0) return RAIN_CATEGORIES.high;
  return RAIN_CATEGORIES.very_high;
}

/**
 * Classify a temperature reading into official SAB temperature scale
 */
export function classifyTemperature(temp: number | null | undefined): TempCategoryInfo {
  const val = Number(temp);
  if (isNaN(val) || val <= 2.0) return TEMP_CATEGORIES.t1;
  if (val <= 6.0) return TEMP_CATEGORIES.t2;
  if (val <= 10.0) return TEMP_CATEGORIES.t3;
  if (val <= 14.0) return TEMP_CATEGORIES.t4;
  if (val <= 18.0) return TEMP_CATEGORIES.t5;
  if (val <= 22.0) return TEMP_CATEGORIES.t6;
  return TEMP_CATEGORIES.t7;
}

/**
 * Humidity Categories (Sensor 2)
 */
export type HumidityCategoryKey = 'h1' | 'h2' | 'h3' | 'h4';
export interface HumidityCategoryInfo {
  key: HumidityCategoryKey;
  label: string;
  rangeLabel: string;
  color: string;
  iconSrc: string;
}

export const HUMIDITY_CATEGORIES: Record<HumidityCategoryKey, HumidityCategoryInfo> = {
  h1: { key: 'h1', label: 'Baja / Aire Seco', rangeLabel: '< 40%', color: '#ea580c', iconSrc: '/sab-assets/TrianguloNaranja.png' },
  h2: { key: 'h2', label: 'Óptima / Confort', rangeLabel: '40% - 60%', color: '#16a34a', iconSrc: '/sab-assets/TrianguloVerde.png' },
  h3: { key: 'h3', label: 'Húmedo', rangeLabel: '60.1% - 80%', color: '#2563eb', iconSrc: '/sab-assets/TrianguloAzul.png' },
  h4: { key: 'h4', label: 'Muy Húmedo / Saturado', rangeLabel: '> 80%', color: '#7c3aed', iconSrc: '/sab-assets/TrainguloMorado.png' },
};

export function classifyHumidity(hum: number | null | undefined): HumidityCategoryInfo {
  const val = Number(hum);
  if (isNaN(val) || val <= 40) return HUMIDITY_CATEGORIES.h1;
  if (val <= 60) return HUMIDITY_CATEGORIES.h2;
  if (val <= 80) return HUMIDITY_CATEGORIES.h3;
  return HUMIDITY_CATEGORIES.h4;
}

/**
 * River / Stream Level Categories (Sensor 3)
 */
export type LevelCategoryKey = 'n1' | 'n2' | 'n3' | 'n4';
export interface LevelCategoryInfo {
  key: LevelCategoryKey;
  label: string;
  rangeLabel: string;
  color: string;
}

export const LEVEL_CATEGORIES: Record<LevelCategoryKey, LevelCategoryInfo> = {
  n1: { key: 'n1', label: 'Nivel Normal / Estable', rangeLabel: '< 1.0 m', color: '#10b981' },
  n2: { key: 'n2', label: 'Nivel Medio / Precaución', rangeLabel: '1.0 - 2.5 m', color: '#eab308' },
  n3: { key: 'n3', label: 'Nivel Alto / Alerta Amarilla', rangeLabel: '2.51 - 4.0 m', color: '#f97316' },
  n4: { key: 'n4', label: 'Nivel Crítico / Alerta Roja', rangeLabel: '> 4.0 m', color: '#ef4444' },
};

export function classifyLevel(lvl: number | null | undefined): LevelCategoryInfo {
  const val = Number(lvl);
  if (isNaN(val) || val < 1.0) return LEVEL_CATEGORIES.n1;
  if (val <= 2.5) return LEVEL_CATEGORIES.n2;
  if (val <= 4.0) return LEVEL_CATEGORIES.n3;
  return LEVEL_CATEGORIES.n4;
}

/**
 * Wind Speed Categories (Sensor 8)
 */
export type WindCategoryKey = 'v1' | 'v2' | 'v3' | 'v4';
export interface WindCategoryInfo {
  key: WindCategoryKey;
  label: string;
  rangeLabel: string;
  color: string;
}

export const WIND_CATEGORIES: Record<WindCategoryKey, WindCategoryInfo> = {
  v1: { key: 'v1', label: 'Calma / Brisa Ligera', rangeLabel: '< 2.0 m/s', color: '#14b8a6' },
  v2: { key: 'v2', label: 'Brisa Suave', rangeLabel: '2.0 - 5.0 m/s', color: '#0ea5e9' },
  v3: { key: 'v3', label: 'Brisa Moderada', rangeLabel: '5.1 - 10.0 m/s', color: '#f59e0b' },
  v4: { key: 'v4', label: 'Viento Fuerte / Rachas', rangeLabel: '> 10.0 m/s', color: '#ef4444' },
};

export function classifyWind(w: number | null | undefined): WindCategoryInfo {
  const val = Number(w);
  if (isNaN(val) || val < 2.0) return WIND_CATEGORIES.v1;
  if (val <= 5.0) return WIND_CATEGORIES.v2;
  if (val <= 10.0) return WIND_CATEGORIES.v3;
  return WIND_CATEGORIES.v4;
}

/**
 * Check if a station is currently registering precipitation
 */
export function isCurrentlyRaining(station: Pick<Station, 'VALORLECTURA'>): boolean {
  return Number(station.VALORLECTURA) > 0;
}

export interface SABStats {
  totalStations: number;
  activeRainingCount: number;
  noneCount: number;
  lowCount: number;
  moderateCount: number;
  highCount: number;
  veryHighCount: number;
  maxRainfall: number;
  maxRainStation: Station | null;
  averageRainfall: number;

  // Temperature specific stats (Sensor 1)
  minTemp: number;
  minTempStation: Station | null;
  maxTemp: number;
  maxTempStation: Station | null;
  averageTemp: number;
  tempCategoryCounts: Record<TempCategoryKey, number>;

  // Humidity specific stats (Sensor 2)
  minHumidity: number;
  minHumidityStation: Station | null;
  maxHumidity: number;
  maxHumidityStation: Station | null;
  averageHumidity: number;
  humidityCategoryCounts: Record<HumidityCategoryKey, number>;

  // Level specific stats (Sensor 3)
  minLevel: number;
  minLevelStation: Station | null;
  maxLevel: number;
  maxLevelStation: Station | null;
  averageLevel: number;
  levelCategoryCounts: Record<LevelCategoryKey, number>;

  // Wind specific stats (Sensor 8)
  minWind: number;
  minWindStation: Station | null;
  maxWind: number;
  maxWindStation: Station | null;
  averageWind: number;
  windCategoryCounts: Record<WindCategoryKey, number>;
}

/**
 * Calculate aggregate statistics across stations
 */
export function calculateStationStats(stations: Station[], sensorType: number = 5): SABStats {
  let activeRainingCount = 0;
  let noneCount = 0;
  let lowCount = 0;
  let moderateCount = 0;
  let highCount = 0;
  let veryHighCount = 0;
  let maxRainfall = 0;
  let maxRainStation: Station | null = null;
  let sumRainfall = 0;

  // Temperature tracking
  let minTemp = 999;
  let minTempStation: Station | null = null;
  let maxTemp = -999;
  let maxTempStation: Station | null = null;
  let sumTemp = 0;
  let validTempCount = 0;

  const tempCategoryCounts: Record<TempCategoryKey, number> = {
    t1: 0,
    t2: 0,
    t3: 0,
    t4: 0,
    t5: 0,
    t6: 0,
    t7: 0,
  };

  // Humidity tracking
  let minHumidity = 999;
  let minHumidityStation: Station | null = null;
  let maxHumidity = -999;
  let maxHumidityStation: Station | null = null;
  let sumHumidity = 0;
  let validHumidityCount = 0;

  const humidityCategoryCounts: Record<HumidityCategoryKey, number> = {
    h1: 0,
    h2: 0,
    h3: 0,
    h4: 0,
  };

  // Level tracking
  let minLevel = 999;
  let minLevelStation: Station | null = null;
  let maxLevel = -999;
  let maxLevelStation: Station | null = null;
  let sumLevel = 0;
  let validLevelCount = 0;

  const levelCategoryCounts: Record<LevelCategoryKey, number> = {
    n1: 0,
    n2: 0,
    n3: 0,
    n4: 0,
  };

  // Wind tracking
  let minWind = 999;
  let minWindStation: Station | null = null;
  let maxWind = -999;
  let maxWindStation: Station | null = null;
  let sumWind = 0;
  let validWindCount = 0;

  const windCategoryCounts: Record<WindCategoryKey, number> = {
    v1: 0,
    v2: 0,
    v3: 0,
    v4: 0,
  };

  for (const s of stations) {
    if (sensorType === 5) {
      const rain = Number(s.ACUMULADODIA) || 0;
      sumRainfall += rain;

      if (rain > maxRainfall) {
        maxRainfall = rain;
        maxRainStation = s;
      }

      if (isCurrentlyRaining(s)) {
        activeRainingCount++;
      }

      const cat = classifyRainfall(rain);
      switch (cat.key) {
        case 'none':
          noneCount++;
          break;
        case 'low':
          lowCount++;
          break;
        case 'moderate':
          moderateCount++;
          break;
        case 'high':
          highCount++;
          break;
        case 'very_high':
          veryHighCount++;
          break;
      }
    } else if (sensorType === 1) {
      // Temperature calculations
      const rawTemp = s.VALORLECTURA != null ? Number(s.VALORLECTURA) : null;
      if (rawTemp != null && !isNaN(rawTemp) && rawTemp < 50 && rawTemp > -20) {
        sumTemp += rawTemp;
        validTempCount++;

        if (rawTemp < minTemp) {
          minTemp = rawTemp;
          minTempStation = s;
        }
        if (rawTemp > maxTemp) {
          maxTemp = rawTemp;
          maxTempStation = s;
        }

        const tCat = classifyTemperature(rawTemp);
        tempCategoryCounts[tCat.key]++;
      }
    } else if (sensorType === 2) {
      // Humidity calculations
      const rawHum = s.VALORLECTURA != null ? Number(s.VALORLECTURA) : s.HUMEDAD != null ? Number(s.HUMEDAD) : null;
      if (rawHum != null && !isNaN(rawHum) && rawHum >= 0 && rawHum <= 100) {
        sumHumidity += rawHum;
        validHumidityCount++;

        if (rawHum < minHumidity) {
          minHumidity = rawHum;
          minHumidityStation = s;
        }
        if (rawHum > maxHumidity) {
          maxHumidity = rawHum;
          maxHumidityStation = s;
        }

        const hCat = classifyHumidity(rawHum);
        humidityCategoryCounts[hCat.key]++;
      }
    } else if (sensorType === 3) {
      // Stream Level calculations
      const rawLvl = s.VALORLECTURA != null ? Number(s.VALORLECTURA) : null;
      if (rawLvl != null && !isNaN(rawLvl) && rawLvl >= 0) {
        sumLevel += rawLvl;
        validLevelCount++;

        if (rawLvl < minLevel) {
          minLevel = rawLvl;
          minLevelStation = s;
        }
        if (rawLvl > maxLevel) {
          maxLevel = rawLvl;
          maxLevelStation = s;
        }

        const lCat = classifyLevel(rawLvl);
        levelCategoryCounts[lCat.key]++;
      }
    } else if (sensorType === 8) {
      // Wind Speed calculations
      const rawWind = s.VALORLECTURA != null ? Number(s.VALORLECTURA) : s.VELOCIDAD != null ? Number(s.VELOCIDAD) : null;
      if (rawWind != null && !isNaN(rawWind) && rawWind >= 0) {
        sumWind += rawWind;
        validWindCount++;

        if (rawWind < minWind) {
          minWind = rawWind;
          minWindStation = s;
        }
        if (rawWind > maxWind) {
          maxWind = rawWind;
          maxWindStation = s;
        }

        const wCat = classifyWind(rawWind);
        windCategoryCounts[wCat.key]++;
      }
    }
  }

  const totalStations = stations.length;
  const averageRainfall = totalStations > 0 ? Number((sumRainfall / totalStations).toFixed(2)) : 0;
  const averageTemp = validTempCount > 0 ? Number((sumTemp / validTempCount).toFixed(1)) : 0;
  const averageHumidity = validHumidityCount > 0 ? Math.round(sumHumidity / validHumidityCount) : 0;
  const averageLevel = validLevelCount > 0 ? Number((sumLevel / validLevelCount).toFixed(2)) : 0;
  const averageWind = validWindCount > 0 ? Number((sumWind / validWindCount).toFixed(1)) : 0;

  return {
    totalStations,
    activeRainingCount,
    noneCount,
    lowCount,
    moderateCount,
    highCount,
    veryHighCount,
    maxRainfall,
    maxRainStation,
    averageRainfall,
    minTemp: minTemp !== 999 ? Number(minTemp.toFixed(1)) : 0,
    minTempStation,
    maxTemp: maxTemp !== -999 ? Number(maxTemp.toFixed(1)) : 0,
    maxTempStation,
    averageTemp,
    tempCategoryCounts,
    minHumidity: minHumidity !== 999 ? Math.round(minHumidity) : 0,
    minHumidityStation,
    maxHumidity: maxHumidity !== -999 ? Math.round(maxHumidity) : 0,
    maxHumidityStation,
    averageHumidity,
    humidityCategoryCounts,
    minLevel: minLevel !== 999 ? Number(minLevel.toFixed(2)) : 0,
    minLevelStation,
    maxLevel: maxLevel !== -999 ? Number(maxLevel.toFixed(2)) : 0,
    maxLevelStation,
    averageLevel,
    levelCategoryCounts,
    minWind: minWind !== 999 ? Number(minWind.toFixed(1)) : 0,
    minWindStation,
    maxWind: maxWind !== -999 ? Number(maxWind.toFixed(1)) : 0,
    maxWindStation,
    averageWind,
    windCategoryCounts,
  };
}

/**
 * Filter stations by search term, category, locality, and sensor mode
 */
export function filterStations(
  stations: Station[],
  query: string,
  categoryFilter: string,
  localityFilter: string,
  onlyRaining: boolean = false,
  sensorType: number = 5
): Station[] {
  const q = query.trim().toLowerCase();
  const loc = localityFilter.trim().toUpperCase();

  return stations.filter((s) => {
    if (sensorType === 5 && onlyRaining && !isCurrentlyRaining(s)) {
      return false;
    }

    if (loc && loc !== 'TODAS' && s.LOCALIDAD?.toUpperCase() !== loc) {
      return false;
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      if (sensorType === 1) {
        const tCat = classifyTemperature(s.VALORLECTURA);
        if (tCat.key !== categoryFilter) return false;
      } else if (sensorType === 5) {
        const cat = classifyRainfall(s.ACUMULADODIA);
        if (cat.key !== categoryFilter) return false;
      } else if (sensorType === 2) {
        const hCat = classifyHumidity(s.VALORLECTURA || s.HUMEDAD);
        if (hCat.key !== categoryFilter) return false;
      } else if (sensorType === 3) {
        const lCat = classifyLevel(s.VALORLECTURA);
        if (lCat.key !== categoryFilter) return false;
      } else if (sensorType === 8) {
        const wCat = classifyWind(s.VALORLECTURA || s.VELOCIDAD);
        if (wCat.key !== categoryFilter) return false;
      }
    }

    if (q) {
      const name = (s.ESTACION || '').toLowerCase();
      const locality = (s.LOCALIDAD || '').toLowerCase();
      const tech = (s.TIPOTECNOLOGIA || '').toLowerCase();
      const id = String(s.IDESTACION || s.IDSENSOR || '');
      if (
        !name.includes(q) &&
        !locality.includes(q) &&
        !tech.includes(q) &&
        !id.includes(q)
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Convert any time string (including 12-hour AM/PM and Spanish a.m./p.m.) into 24-hour format (HH:mm)
 */
export function to24HourTime(timeStr?: string | null): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (!trimmed) return '';

  const isPm = /\b(pm|p\.m\.|p\.m)\b/i.test(trimmed);
  const isAm = /\b(am|a\.m\.|a\.m)\b/i.test(trimmed);

  const match = trimmed.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return trimmed;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];

  if (isPm && hours < 12) {
    hours += 12;
  } else if (isAm && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Format a Date object into strict 24-hour time format (HH:mm)
 */
export function formatTime24(date?: Date | null): string {
  if (!date || isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Format Colombian date & time in strict 24-hour format
 * Converts any 12-hour AM/PM representations to 24 hours (00:00 - 23:59).
 */
export function formatReadingDateTime(dateStr?: string | null): { date: string; time: string } {
  if (!dateStr) return { date: 'N/A', time: 'N/A' };
  try {
    const trimmed = dateStr.trim();
    if (!trimmed) return { date: 'N/A', time: 'N/A' };

    const isPm = /\b(pm|p\.m\.|p\.m)\b/i.test(trimmed);
    const isAm = /\b(am|a\.m\.|a\.m)\b/i.test(trimmed);

    // Normalize separators: replace 'T' with space if ISO format
    const cleanStr = trimmed.replace('T', ' ');

    // Extract time pattern HH:mm or HH:mm:ss
    const timeMatch = cleanStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);

    // Extract date pattern YYYY-MM-DD or DD/MM/YYYY
    const dateMatch = cleanStr.match(/(\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})/);
    const datePart = dateMatch ? dateMatch[1] : (cleanStr.split(' ')[0] || trimmed);

    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2];

      if (isPm && hours < 12) {
        hours += 12;
      } else if (isAm && hours === 12) {
        hours = 0;
      }

      const formattedHour = String(hours).padStart(2, '0');
      return {
        date: datePart,
        time: `${formattedHour}:${minutes}`,
      };
    }

    return { date: datePart, time: '' };
  } catch {
    return { date: String(dateStr), time: '' };
  }
}

/**
 * Calculates Haversine distance between two coordinates in meters
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (
    typeof lat1 !== 'number' || isNaN(lat1) ||
    typeof lon1 !== 'number' || isNaN(lon1) ||
    typeof lat2 !== 'number' || isNaN(lat2) ||
    typeof lon2 !== 'number' || isNaN(lon2)
  ) {
    return Infinity;
  }
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance in meters or kilometers safely
 */
export function formatDistance(meters: number): string {
  if (typeof meters !== 'number' || isNaN(meters) || !isFinite(meters)) {
    return '-- m';
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

