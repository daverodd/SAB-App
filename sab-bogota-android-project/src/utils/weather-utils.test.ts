import test from "node:test";
import assert from "node:assert/strict";
import {
  categorizeRainfall,
  calculateStationStats,
  haversineDistance,
  findNearestStation,
  formatObservationTime,
  type Station,
} from "./weather-utils";

test("categorizeRainfall handles dry and all precipitation levels correctly", () => {
  assert.equal(categorizeRainfall(0).category, "seco");
  assert.equal(categorizeRainfall(0.1).category, "seco");
  assert.equal(categorizeRainfall(2.5).category, "llovizna");
  assert.equal(categorizeRainfall(10.0).category, "ligera");
  assert.equal(categorizeRainfall(22.0).category, "moderada");
  assert.equal(categorizeRainfall(45.0).category, "fuerte");
  assert.equal(categorizeRainfall(65.0).category, "torrencial");
});

test("calculateStationStats accurately calculates counts, rain statistics and max station", () => {
  const dummyStations: Station[] = [
    {
      IDSENSOR: 1,
      IDESTACION: 101,
      ESTACION: "Usaquén Norte",
      IDTIPOSENSOR: 5,
      TIPOSENSOR: "Pluviometro",
      UNIDADMEDIDA: "Milimetros",
      LATITUD: 4.75,
      LONGITUD: -74.03,
      ESTADO: 1,
      LOCALIDAD: "USAQUEN",
      ACUMULADODIA: 12.4,
      VALORLECTURA: 2.1,
      FECHALECTURA: "2026-10-27 12:00:00.0",
    },
    {
      IDSENSOR: 2,
      IDESTACION: 102,
      ESTACION: "Suba Centro",
      IDTIPOSENSOR: 5,
      TIPOSENSOR: "Pluviometro",
      UNIDADMEDIDA: "Milimetros",
      LATITUD: 4.74,
      LONGITUD: -74.08,
      ESTADO: 1,
      LOCALIDAD: "SUBA",
      ACUMULADODIA: 0,
      VALORLECTURA: 0,
      FECHALECTURA: "2026-10-27 12:00:00.0",
    },
  ];

  const stats = calculateStationStats(dummyStations);
  assert.equal(stats.total, 2);
  assert.equal(stats.active, 2);
  assert.equal(stats.rainingCount, 1);
  assert.equal(stats.maxAcumulado, 12.4);
  assert.equal(stats.maxStation?.ESTACION, "Usaquén Norte");
  assert.deepEqual(stats.localitiesWithRain, ["USAQUEN"]);
});

test("haversineDistance calculates accurate distance between coordinates", () => {
  // Plaza de Bolívar (4.5981, -74.0758) to Parque de la 93 (4.6766, -74.0487) ~ 9.2 km
  const dist = haversineDistance(4.5981, -74.0758, 4.6766, -74.0487);
  assert.ok(dist > 8.5 && dist < 10.0, `Expected distance ~9.2km, got ${dist}`);
});

test("findNearestStation locates the closest sensor", () => {
  const stations: Station[] = [
    {
      IDSENSOR: 1,
      IDESTACION: 1,
      ESTACION: "Norte",
      IDTIPOSENSOR: 5,
      TIPOSENSOR: "Pluviometro",
      UNIDADMEDIDA: "Milimetros",
      LATITUD: 4.8,
      LONGITUD: -74.03,
      ESTADO: 1,
      LOCALIDAD: "USAQUEN",
      ACUMULADODIA: 0,
      VALORLECTURA: 0,
      FECHALECTURA: "",
    },
    {
      IDSENSOR: 2,
      IDESTACION: 2,
      ESTACION: "Sur",
      IDTIPOSENSOR: 5,
      TIPOSENSOR: "Pluviometro",
      UNIDADMEDIDA: "Milimetros",
      LATITUD: 4.5,
      LONGITUD: -74.1,
      ESTADO: 1,
      LOCALIDAD: "USME",
      ACUMULADODIA: 0,
      VALORLECTURA: 0,
      FECHALECTURA: "",
    },
  ];

  const res = findNearestStation(4.79, -74.035, stations);
  assert.equal(res?.station.ESTACION, "Norte");
});

test("formatObservationTime extracts HH:MM", () => {
  assert.equal(formatObservationTime("2026-10-27 12:56:00.0"), "12:56");
  assert.equal(formatObservationTime(""), "--:--");
});
