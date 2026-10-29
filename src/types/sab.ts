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

export type SensorTypeId = 5 | 1 | 2;

export interface SensorTypeOption {
  id: SensorTypeId;
  name: string;
  shortName: string;
  unit: string;
  icon: string;
  description: string;
}

export const SENSOR_TYPES: SensorTypeOption[] = [
  {
    id: 5,
    name: 'Lluvias',
    shortName: 'Lluvias',
    unit: 'mm',
    icon: 'CloudRain',
    description: 'Monitoreo de precipitaciones en tiempo real y acumuladas del día',
  },
  {
    id: 1,
    name: 'Temperatura del Aire',
    shortName: 'Temperatura',
    unit: '°C',
    icon: 'Thermometer',
    description: 'Temperatura ambiental en tiempo real',
  },
  {
    id: 2,
    name: 'Humedad Relativa',
    shortName: 'Humedad',
    unit: '%',
    icon: 'Droplets',
    description: 'Humedad relativa del aire en la capital',
  },
];

export interface RadarOverlayConfig {
  imageUrl: string;
  bounds: [[number, number], [number, number]]; // [[south, west], [north, east]]
  lastUpdated: string;
}

export const BOGOTA_RADAR_BOUNDS: [[number, number], [number, number]] = [
  [4.132579471620416, -74.65475187262749], // south, west
  [5.217750127612162, -73.57319917717719], // north, east
];
