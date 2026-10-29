/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Header, ClosestStationInfo } from './components/Header';
import { SABMap } from './components/SABMap';
import { StationLegendTable } from './components/StationLegendTable';
import { StationDetailsModal } from './components/StationDetailsModal';
import { StationDirectoryTable } from './components/StationDirectoryTable';
import { fetchStations, fetchLocalidadesGeoJson } from './services/sabApi';
import { useRainAlert } from './hooks/useRainAlert';
import { Station, SensorTypeId } from './types/sab';
import {
  calculateStationStats,
  filterStations,
  isCurrentlyRaining,
  getDistanceInMeters,
  formatDistance,
} from './utils/sabLogic';

export default function App() {
  const [currentSensorType, setCurrentSensorType] = useState<SensorTypeId>(5);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [localidadesGeoJson, setLocalidadesGeoJson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataSource, setDataSource] = useState<'live' | 'cache'>('live');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters & Selection
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyRaining, setOnlyRaining] = useState<boolean>(false);
  const [selectedLocality, setSelectedLocality] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [stationForHistory, setStationForHistory] = useState<Station | null>(null);

  // GPS User Location & Closest Station
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  useRainAlert(userLocation);
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [triggerGpsKey, setTriggerGpsKey] = useState<number>(0);

  // Radar Controls
  const [showRadar, setShowRadar] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.4);
  const [radarNonce, setRadarNonce] = useState<number>(Date.now());
  const [radarMode, setRadarMode] = useState<'live' | 'animated'>('live');

  const isRadarSlicerActive = showRadar && currentSensorType === 5;

  // View mode
  const [viewMode, setViewMode] = useState<'map' | 'table'>('map');

  // Load Data
  const loadData = useCallback(async (sensorTypeId: SensorTypeId) => {
    setIsLoading(true);
    try {
      const result = await fetchStations(sensorTypeId);
      setAllStations(result.stations);
      setDataSource(result.source);
      setLastUpdated(result.timestamp);
      // Synchronously refresh the live radar overlay
      setRadarNonce(Date.now());
    } catch (err) {
      console.error('Failed to load stations data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadData(currentSensorType);
    fetchLocalidadesGeoJson().then((data) => {
      if (data) setLocalidadesGeoJson(data);
    });

    // Auto-refresh data and radar every 60 seconds matching SAB interval
    const interval = setInterval(() => {
      loadData(currentSensorType);
      setRadarNonce(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, [currentSensorType, loadData]);

  // Statistics across all stations
  const stats = useMemo(() => {
    return calculateStationStats(allStations, currentSensorType);
  }, [allStations, currentSensorType]);

  // Closest station calculation based on GPS location and active sensor
  const closestStationInfo: ClosestStationInfo | null = useMemo(() => {
    if (!userLocation || allStations.length === 0) return null;

    const uLat = Number(userLocation.lat);
    const uLng = Number(userLocation.lng);
    if (isNaN(uLat) || isNaN(uLng)) return null;

    let closest: Station | null = null;
    let minDistance = Infinity;

    for (const station of allStations) {
      if (station.LATITUD == null || station.LONGITUD == null) continue;
      const sLat = typeof station.LATITUD === 'number' ? station.LATITUD : parseFloat(String(station.LATITUD));
      const sLon = typeof station.LONGITUD === 'number' ? station.LONGITUD : parseFloat(String(station.LONGITUD));
      if (isNaN(sLat) || isNaN(sLon) || (sLat === 0 && sLon === 0)) continue;

      const d = getDistanceInMeters(uLat, uLng, sLat, sLon);
      if (!isNaN(d) && d < minDistance) {
        minDistance = d;
        closest = station;
      }
    }

    if (!closest) return null;

    let readingFormatted = '';
    if (currentSensorType === 1) {
      const raw = Number(closest.VALORLECTURA);
      readingFormatted = !isNaN(raw) ? `${raw.toFixed(1)} °C` : '-- °C';
    } else if (currentSensorType === 2) {
      const hum = Number(closest.VALORLECTURA ?? closest.HUMEDAD);
      readingFormatted = !isNaN(hum) ? `${Math.round(hum)}%` : '--%';
    } else {
      const rain = Number(closest.ACUMULADODIA) || 0;
      const isRainingNow = isCurrentlyRaining(closest);
      readingFormatted = isRainingNow ? `💧 ${rain} mm` : `${rain} mm`;
    }

    return {
      station: closest,
      distanceMeters: minDistance,
      distanceFormatted: formatDistance(minDistance),
      readingFormatted,
    };
  }, [userLocation, allStations, currentSensorType]);

  // Filtered stations for display on the map or table
  const displayedStations = useMemo(() => {
    return filterStations(
      allStations,
      searchQuery,
      selectedCategory,
      selectedLocality,
      onlyRaining,
      currentSensorType
    );
  }, [allStations, searchQuery, selectedCategory, selectedLocality, onlyRaining, currentSensorType]);

  // Handlers
  const handleSelectSensorType = (typeId: SensorTypeId) => {
    setCurrentSensorType(typeId);
    setSelectedCategory('ALL');
    setOnlyRaining(false);
    setSelectedStation(null);
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setOnlyRaining(false);
    setSelectedLocality('TODAS');
    setSearchQuery('');
  };

  const handleSelectStationOnMap = (st: Station) => {
    setSelectedStation(st);
    setViewMode('map');
  };

  const handleTriggerGps = () => {
    setTriggerGpsKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0c0f17] font-sans select-none">
      {/* Top Main Navigation Header */}
      <Header
        currentSensorType={currentSensorType}
        onSelectSensorType={handleSelectSensorType}
        stats={stats}
        lastUpdated={lastUpdated}
        dataSource={dataSource}
        isLoading={isLoading}
        onRefresh={() => loadData(currentSensorType)}
        closestStationInfo={closestStationInfo}
        isLocatingGps={isLocatingGps}
        onTriggerGps={handleTriggerGps}
        onSelectStation={handleSelectStationOnMap}
      />

      {/* Main View Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {viewMode === 'map' ? (
          <div className="relative w-full h-full">
            {/* Full Leaflet Map */}
            <SABMap
              stations={displayedStations}
              allStations={allStations}
              currentSensorType={currentSensorType}
              selectedStation={selectedStation}
              onSelectStation={setSelectedStation}
              onOpenStationHistory={(st) => setStationForHistory(st)}
              localidadesGeoJson={localidadesGeoJson}
              showRadar={showRadar}
              onToggleRadar={setShowRadar}
              radarOpacity={radarOpacity}
              onChangeRadarOpacity={setRadarOpacity}
              radarNonce={radarNonce}
              onRefreshRadar={() => setRadarNonce(Date.now())}
              onLocationChange={setUserLocation}
              onLocatingStateChange={setIsLocatingGps}
              triggerGpsKey={triggerGpsKey}
              radarMode={radarMode}
              onChangeRadarMode={setRadarMode}
            />

            {/* Official Floating Legend & Filtering Table (Bottom Right) */}
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 z-20">
              <StationLegendTable
                currentSensorType={currentSensorType}
                stats={stats}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                onlyRaining={onlyRaining}
                onToggleOnlyRaining={() => setOnlyRaining(!onlyRaining)}
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
        ) : (
          /* Table / Directory View */
          <StationDirectoryTable
            stations={allStations}
            currentSensorType={currentSensorType}
            onSelectStationOnMap={handleSelectStationOnMap}
            onOpenStationHistory={(st) => setStationForHistory(st)}
          />
        )}
      </main>

      {/* 6-Hour Historical Records Deep-Dive Modal */}
      <StationDetailsModal
        station={stationForHistory}
        currentSensorType={currentSensorType}
        onClose={() => setStationForHistory(null)}
      />
    </div>
  );
}
