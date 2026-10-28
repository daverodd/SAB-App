import React from 'react';
import {
  CloudRain,
  Thermometer,
  Droplets,
  RefreshCw,
  MapPin,
  Navigation,
  Loader2,
  Table,
  Map as MapIcon,
} from 'lucide-react';
import { SENSOR_TYPES, SensorTypeId, Station } from '../types/sab';
import { SABStats, formatTime24 } from '../utils/sabLogic';

export interface ClosestStationInfo {
  station: Station;
  distanceMeters: number;
  distanceFormatted: string;
  readingFormatted: string;
}

interface HeaderProps {
  currentSensorType: SensorTypeId;
  onSelectSensorType: (id: SensorTypeId) => void;
  stats: SABStats;
  lastUpdated: Date | null;
  dataSource: 'live' | 'cache';
  isLoading: boolean;
  onRefresh: () => void;
  viewMode: 'map' | 'table';
  onChangeViewMode: (mode: 'map' | 'table') => void;
  closestStationInfo: ClosestStationInfo | null;
  isLocatingGps: boolean;
  onTriggerGps: () => void;
  onSelectStation: (station: Station) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSensorType,
  onSelectSensorType,
  stats,
  lastUpdated,
  isLoading,
  onRefresh,
  viewMode,
  onChangeViewMode,
  closestStationInfo,
  isLocatingGps,
  onTriggerGps,
  onSelectStation,
}) => {
  const getSensorIcon = (iconName: string) => {
    switch (iconName) {
      case 'CloudRain':
        return <CloudRain className="w-4 h-4" />;
      case 'Thermometer':
        return <Thermometer className="w-4 h-4" />;
      case 'Droplets':
        return <Droplets className="w-4 h-4" />;
      default:
        return <CloudRain className="w-4 h-4" />;
    }
  };

  return (
    <header className="bg-slate-900/98 backdrop-blur-md text-white border-b border-slate-800 shadow-xl relative z-30 select-none">
      <div className="w-full px-2.5 sm:px-4 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* LINE 1: VARIABLE SELECTOR TABS (Lluvia, Temperatura, Humedad - Squircles) */}
          <nav
            aria-label="Variables meteorológicas"
            className="flex items-center justify-between sm:justify-start gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 w-full md:w-auto shrink-0"
          >
            {SENSOR_TYPES.map((type) => {
              const active = currentSensorType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onSelectSensorType(type.id)}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {getSensorIcon(type.icon)}
                  <span>{type.shortName}</span>
                </button>
              );
            })}
          </nav>

          {/* LINE 2: ALL REMAINING CONTROLS & STATS (Second line below tabs on mobile) */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 w-full md:w-auto shrink-0">
            {/* Dynamic Sensor Stat Pill */}
            {currentSensorType === 5 && (
              <>
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-300 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span>Estaciones: <strong className="text-white">{stats.totalStations}</strong></span>
                </div>
                {stats.activeRainingCount > 0 ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold animate-pulse">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Lloviendo: <strong>{stats.activeRainingCount}</strong></span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Sin lluvia</span>
                  </div>
                )}
                {stats.maxRainfall > 0 && (
                  <div className="hidden xl:flex items-center gap-1 text-xs text-amber-300 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
                    <span>Pico:</span>
                    <strong className="text-amber-400">{stats.maxRainfall} mm</strong>
                    <span className="text-slate-400">({stats.maxRainStation?.LOCALIDAD})</span>
                  </div>
                )}
              </>
            )}

            {currentSensorType === 1 && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-blue-200">
                <span>Mín: <strong className="text-blue-300">{stats.minTemp}°C</strong></span>
                <span className="text-slate-600">•</span>
                <span>Prom: <strong className="text-white">{stats.averageTemp}°C</strong></span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="hidden sm:inline">Máx: <strong className="text-amber-300">{stats.maxTemp}°C</strong></span>
              </div>
            )}

            {currentSensorType === 2 && (
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-amber-200">
                <span>Mín: <strong className="text-amber-300">{stats.minHumidity}%</strong></span>
                <span className="text-slate-600">•</span>
                <span>Prom: <strong className="text-white">{stats.averageHumidity}%</strong></span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="hidden sm:inline">Máx: <strong className="text-indigo-300">{stats.maxHumidity}%</strong></span>
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Closest Station Button */}
              {closestStationInfo && closestStationInfo.station ? (
                <button
                  type="button"
                  onClick={() => onSelectStation(closestStationInfo.station)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-950/70 hover:bg-blue-900/90 text-blue-200 border border-blue-500/50 hover:border-blue-400 text-xs transition shadow-sm group cursor-pointer max-w-[120px] sm:max-w-[150px]"
                  title={`Estación más cercana: ${closestStationInfo.station.ESTACION || 'Estación'} (${closestStationInfo.distanceFormatted})`}
                >
                  <Navigation className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="font-semibold text-white truncate">
                    {closestStationInfo.station.ESTACION || 'Estación'}
                  </span>
                  <span className="text-blue-300 font-mono text-[11px] hidden lg:inline shrink-0">
                    ({closestStationInfo.distanceFormatted})
                  </span>
                </button>
              ) : isLocatingGps ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs border border-slate-700 shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  <span className="text-[11px]">GPS...</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onTriggerGps}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition cursor-pointer shrink-0"
                  title="Activar GPS para detectar tu estación más cercana"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[11px]">GPS</span>
                </button>
              )}

              {/* View Mode Toggle (Map vs Table) */}
              <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => onChangeViewMode('map')}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista de mapa interactivo"
                  aria-label="Vista de mapa"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onChangeViewMode('table')}
                  className={`p-1.5 rounded-xl transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista de tabla y directorio"
                  aria-label="Vista de tabla"
                >
                  <Table className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white text-xs font-medium border border-slate-700 transition cursor-pointer shrink-0"
                title="Refrescar datos meteorológicos IDIGER"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
                <span className="hidden sm:inline">
                  {lastUpdated ? formatTime24(lastUpdated) : 'Actualizar'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
