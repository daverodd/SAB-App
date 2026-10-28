import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyRainfall,
  isCurrentlyRaining,
  calculateStationStats,
  filterStations,
  formatReadingDateTime,
  to24HourTime,
  formatTime24,
  getDistanceInMeters,
  formatDistance,
} from './sabLogic.ts';
import type { Station } from './sabLogic.ts';

const mockStations: Station[] = [
  {
    IDSENSOR: 1,
    IDESTACION: 101,
    ESTACION: 'San Cristóbal Sur',
    IDTIPOSENSOR: 5,
    TIPOSENSOR: 'Pluviometro',
    UNIDADMEDIDA: 'Milimetros',
    LATITUD: 4.56,
    LONGITUD: -74.08,
    ESTADO: 1,
    IDTIPOTECNOLOGIA: 1,
    TIPOTECNOLOGIA: 'Motorola',
    IDLOCALIDAD: 4,
    LOCALIDAD: 'SAN CRISTOBAL',
    VISIBLE: 1,
    ACUMULADODIA: 0,
    VALORLECTURA: 0,
    FECHALECTURA: '2026-10-17 14:30:00.0',
    ALTITUD: 2600,
  },
  {
    IDSENSOR: 2,
    IDESTACION: 102,
    ESTACION: 'Usaquén Country',
    IDTIPOSENSOR: 5,
    TIPOSENSOR: 'Pluviometro',
    UNIDADMEDIDA: 'Milimetros',
    LATITUD: 4.70,
    LONGITUD: -74.03,
    ESTADO: 1,
    IDTIPOTECNOLOGIA: 2,
    TIPOTECNOLOGIA: 'Campbell',
    IDLOCALIDAD: 1,
    LOCALIDAD: 'USAQUEN',
    VISIBLE: 1,
    ACUMULADODIA: 5.4,
    VALORLECTURA: 0.8,
    FECHALECTURA: '2026-10-17 14:32:00.0',
    ALTITUD: 2580,
  },
  {
    IDSENSOR: 3,
    IDESTACION: 103,
    ESTACION: 'Suba La Floresta',
    IDTIPOSENSOR: 5,
    TIPOSENSOR: 'Pluviometro',
    UNIDADMEDIDA: 'Milimetros',
    LATITUD: 4.69,
    LONGITUD: -74.07,
    ESTADO: 1,
    IDTIPOTECNOLOGIA: 2,
    TIPOTECNOLOGIA: 'Campbell',
    IDLOCALIDAD: 11,
    LOCALIDAD: 'SUBA',
    VISIBLE: 1,
    ACUMULADODIA: 18.2,
    VALORLECTURA: 0,
    FECHALECTURA: '2026-10-17 14:31:00.0',
    ALTITUD: 2570,
  },
  {
    IDSENSOR: 4,
    IDESTACION: 104,
    ESTACION: 'Ciudad Bolívar Cumbre',
    IDTIPOSENSOR: 5,
    TIPOSENSOR: 'Pluviometro',
    UNIDADMEDIDA: 'Milimetros',
    LATITUD: 4.54,
    LONGITUD: -74.14,
    ESTADO: 1,
    IDTIPOTECNOLOGIA: 1,
    TIPOTECNOLOGIA: 'Motorola',
    IDLOCALIDAD: 19,
    LOCALIDAD: 'CIUDAD BOLIVAR',
    VISIBLE: 1,
    ACUMULADODIA: 42.0,
    VALORLECTURA: 1.5,
    FECHALECTURA: '2026-10-17 14:35:00.0',
    ALTITUD: 2800,
  },
  {
    IDSENSOR: 5,
    IDESTACION: 105,
    ESTACION: 'Sumapaz Páramo',
    IDTIPOSENSOR: 5,
    TIPOSENSOR: 'Pluviometro',
    UNIDADMEDIDA: 'Milimetros',
    LATITUD: 4.17,
    LONGITUD: -74.15,
    ESTADO: 1,
    IDTIPOTECNOLOGIA: 2,
    TIPOTECNOLOGIA: 'Campbell',
    IDLOCALIDAD: 20,
    LOCALIDAD: 'SUMAPAZ',
    VISIBLE: 1,
    ACUMULADODIA: 65.5,
    VALORLECTURA: 3.2,
    FECHALECTURA: '2026-10-17 14:35:00.0',
    ALTITUD: 3400,
  },
];

test('classifyRainfall categorizes accurately according to official SAB thresholds', () => {
  assert.equal(classifyRainfall(0).key, 'none');
  assert.equal(classifyRainfall(0.02).key, 'none');
  assert.equal(classifyRainfall(0.1).key, 'low');
  assert.equal(classifyRainfall(10).key, 'low');
  assert.equal(classifyRainfall(10.1).key, 'moderate');
  assert.equal(classifyRainfall(30).key, 'moderate');
  assert.equal(classifyRainfall(30.1).key, 'high');
  assert.equal(classifyRainfall(50).key, 'high');
  assert.equal(classifyRainfall(50.1).key, 'very_high');
  assert.equal(classifyRainfall(120).key, 'very_high');
});

test('isCurrentlyRaining detects active precipitation', () => {
  assert.equal(isCurrentlyRaining({ VALORLECTURA: 0 }), false);
  assert.equal(isCurrentlyRaining({ VALORLECTURA: 0.1 }), true);
  assert.equal(isCurrentlyRaining({ VALORLECTURA: 4.5 }), true);
});

test('calculateStationStats tallies totals, buckets and records', () => {
  const stats = calculateStationStats(mockStations);
  assert.equal(stats.totalStations, 5);
  assert.equal(stats.noneCount, 1);
  assert.equal(stats.lowCount, 1);
  assert.equal(stats.moderateCount, 1);
  assert.equal(stats.highCount, 1);
  assert.equal(stats.veryHighCount, 1);
  assert.equal(stats.activeRainingCount, 3);
  assert.equal(stats.maxRainfall, 65.5);
  assert.equal(stats.maxRainStation?.ESTACION, 'Sumapaz Páramo');
  assert.equal(stats.averageRainfall, 26.22);
});

test('filterStations handles search query, category and locality filters', () => {
  // Query by station name
  const filtered1 = filterStations(mockStations, 'usaquén', 'ALL', 'TODAS');
  assert.equal(filtered1.length, 1);
  assert.equal(filtered1[0].ESTACION, 'Usaquén Country');

  // Filter by locality
  const filteredLoc = filterStations(mockStations, '', 'ALL', 'SUBA');
  assert.equal(filteredLoc.length, 1);
  assert.equal(filteredLoc[0].LOCALIDAD, 'SUBA');

  // Filter by category
  const filteredHigh = filterStations(mockStations, '', 'high', 'TODAS');
  assert.equal(filteredHigh.length, 1);
  assert.equal(filteredHigh[0].ESTACION, 'Ciudad Bolívar Cumbre');

  // Filter only currently raining
  const filteredRaining = filterStations(mockStations, '', 'ALL', 'TODAS', true);
  assert.equal(filteredRaining.length, 3);
});

test('formatReadingDateTime extracts date and 24-hr time correctly', () => {
  const formatted = formatReadingDateTime('2026-10-17 17:15:00.0');
  assert.equal(formatted.date, '2026-10-17');
  assert.equal(formatted.time, '17:15');

  const empty = formatReadingDateTime(null);
  assert.equal(empty.date, 'N/A');
});

test('formatReadingDateTime converts 12-hour AM/PM to 24-hour format', () => {
  // Afternoon PM -> 24h
  const pmResult = formatReadingDateTime('2026-10-17 05:15:00 PM');
  assert.equal(pmResult.date, '2026-10-17');
  assert.equal(pmResult.time, '17:15');

  // Morning AM -> 24h
  const amResult = formatReadingDateTime('2026-10-17 05:15:00 AM');
  assert.equal(amResult.time, '05:15');

  // Midnight 12 AM -> 00:xx
  const midnightResult = formatReadingDateTime('2026-10-17 12:30:00 AM');
  assert.equal(midnightResult.time, '00:30');

  // Noon 12 PM -> 12:xx
  const noonResult = formatReadingDateTime('2026-10-17 12:30:00 PM');
  assert.equal(noonResult.time, '12:30');

  // Spanish p.m. format
  const spanishPm = formatReadingDateTime('2026-10-17 08:45 p.m.');
  assert.equal(spanishPm.time, '20:45');

  // Spanish a.m. format
  const spanishAm = formatReadingDateTime('2026-10-17 08:45 a.m.');
  assert.equal(spanishAm.time, '08:45');

  // ISO string format
  const isoResult = formatReadingDateTime('2026-10-17T14:22:00.000Z');
  assert.equal(isoResult.date, '2026-10-17');
  assert.equal(isoResult.time, '14:22');
});

test('to24HourTime converts string hours into 24-hour HH:mm', () => {
  assert.equal(to24HourTime('3:45 PM'), '15:45');
  assert.equal(to24HourTime('3:45 AM'), '03:45');
  assert.equal(to24HourTime('12:00 AM'), '00:00');
  assert.equal(to24HourTime('12:00 PM'), '12:00');
  assert.equal(to24HourTime('11:30 p.m.'), '23:30');
  assert.equal(to24HourTime('11:30 a.m.'), '11:30');
  assert.equal(to24HourTime('18:20'), '18:20');
});

test('formatTime24 formats Date objects in strict 24-hour notation', () => {
  const dateEvening = new Date(2026, 9, 26, 17, 30);
  assert.equal(formatTime24(dateEvening), '17:30');

  const dateMorning = new Date(2026, 9, 26, 9, 5);
  assert.equal(formatTime24(dateMorning), '09:05');

  const dateMidnight = new Date(2026, 9, 26, 0, 0);
  assert.equal(formatTime24(dateMidnight), '00:00');
});

test('getDistanceInMeters calculates accurate distance and handles invalid inputs gracefully', () => {
  // Plaza de Bolívar (4.62685, -74.0683) to Simón Bolívar Park (4.6583, -74.0934) ~ 4.4 km
  const dist = getDistanceInMeters(4.62685, -74.0683, 4.6583, -74.0934);
  assert.ok(dist > 4000 && dist < 5000, `Expected ~4.4km, got ${dist}`);

  // Same coordinates distance is 0
  assert.equal(getDistanceInMeters(4.6, -74.0, 4.6, -74.0), 0);

  // Invalid coordinates return Infinity
  assert.equal(getDistanceInMeters(NaN, -74.0, 4.6, -74.0), Infinity);
  assert.equal(getDistanceInMeters(4.6, NaN, 4.6, -74.0), Infinity);
});

test('formatDistance formats meters and kilometers accurately without NaN', () => {
  assert.equal(formatDistance(0), '0 m');
  assert.equal(formatDistance(450), '450 m');
  assert.equal(formatDistance(999), '999 m');
  assert.equal(formatDistance(1000), '1.0 km');
  assert.equal(formatDistance(3500), '3.5 km');
  assert.equal(formatDistance(42500), '42.5 km');
  assert.equal(formatDistance(NaN), '-- m');
  assert.equal(formatDistance(Infinity), '-- m');
});

