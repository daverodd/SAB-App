import React from 'react';
import {
  CloudRain,
  Thermometer,
  Droplets,
  RefreshCw,
  MapPin,
  Navigation,
  Loader2,
} from 'lucide-react';
import { SENSOR_TYPES, SensorTypeId, Station } from '../types/sab';
import { SABStats, formatTime24, isCurrentlyRaining } from '../utils/sabLogic';
import { rainStatusText } from '../utils/rainStatus';

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
  viewMode?: 'map' | 'table';
  onChangeViewMode?: (mode: 'map' | 'table') => void;
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
  const getSensorIcon = (iconName: string, active: boolean) => {
    const iconClass = `w-4 h-4 ${active ? 'text-white' : 'text-[#8a9bb2]'}`;
    switch (iconName) {
      case 'CloudRain':
        return <CloudRain className={iconClass} />;
      case 'Thermometer':
        return <Thermometer className={iconClass} />;
      case 'Droplets':
        return <Droplets className={iconClass} />;
      default:
        return <CloudRain className={iconClass} />;
    }
  };

  return (
    <header className="bg-[#0e111a]/95 backdrop-blur-md text-white border-b border-[#1c2230] shadow-xl relative z-30 select-none">
      <div className="w-full px-2.5 sm:px-4 py-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* LINE 1: VARIABLE SELECTOR TABS (Lluvias, Temperatura, Humedad - Squircles) */}
          <nav
            aria-label="Variables meteorológicas"
            className="flex items-center justify-between sm:justify-start gap-1 bg-[#10141d]/90 p-1 rounded-2xl border border-[#1f2636] w-full md:w-auto shrink-0"
          >
            {SENSOR_TYPES.map((type) => {
              const active = currentSensorType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onSelectSensorType(type.id)}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#df8b35] via-[#d6802a] to-[#c57220] text-white shadow-[0_2px_12px_rgba(223,139,53,0.35)] ring-1 ring-[#e59a44]/50'
                      : 'bg-[#151922] text-[#718096] hover:text-white hover:bg-[#1c2230] border border-[#202738]'
                  }`}
                >
                  {getSensorIcon(type.icon, active)}
                  <span>{type.shortName}</span>
                </button>
              );
            })}
          </nav>

          {/* LINE 2: COMPACT STATS & CONTROLS */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-2 w-full md:w-auto shrink-0">
            {/* LLUVIAS (Sensor 5): 2 icon badges */}
            {currentSensorType === 5 && (
              <div className="flex items-center gap-1.5">
                {/* Badge 1: Stations reporting rain count (icon + count, minimal text) */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition shadow-xs ${
                    stats.activeRainingCount > 0
                      ? 'bg-[#181d28] border-amber-500/50 text-amber-400'
                      : 'bg-[#151922] border-[#252c3c] text-[#718096]'
                  }`}
                  title={`${stats.activeRainingCount} de ${stats.totalStations} estaciones reportando lluvia`}
                >
                  <CloudRain className={`w-3.5 h-3.5 ${stats.activeRainingCount > 0 ? 'text-[#df8b35] animate-pulse' : 'text-[#718096]'}`} />
                  <span className="font-mono text-xs">{stats.activeRainingCount}</span>
                </div>

                {/* Badge 2: Nearest station rain status (icon-driven, minimal text) */}
                {closestStationInfo && closestStationInfo.station ? (
                  <button
                    type="button"
                    onClick={() => onSelectStation(closestStationInfo.station)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-semibold transition cursor-pointer ${
                      isCurrentlyRaining(closestStationInfo.station)
                        ? 'bg-gradient-to-r from-[#df8b35] to-[#c57220] text-white border-amber-400/40 shadow-sm'
                        : 'bg-[#151922] text-slate-200 hover:text-white border-[#252c3c] hover:bg-[#1c2230]'
                    }`}
                    title={`Estación más cercana: ${closestStationInfo.station.ESTACION || 'Estación'} (${closestStationInfo.distanceFormatted}) • ${Number(closestStationInfo.station.ACUMULADODIA ?? 0)} mm hoy`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{rainStatusText(closestStationInfo.station)}</span>
                  </button>
                ) : isLocatingGps ? (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#151922] text-[#718096] text-xs border border-[#252c3c]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#df8b35]" />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onTriggerGps}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-[#151922] hover:bg-[#1c2230] text-[#718096] hover:text-white text-xs border border-[#252c3c] transition cursor-pointer"
                    title="Detectar estación más cercana vía GPS"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#df8b35]" />
                  </button>
                )}
              </div>
            )}

            {/* TEMPERATURA (Sensor 1): Nearest as main, Min & Prom as side info */}
            {currentSensorType === 1 && (
              <div className="flex items-center gap-1.5">
                {/* Nearest (MAIN) */}
                {closestStationInfo && closestStationInfo.station ? (
                  <button
                    type="button"
                    onClick={() => onSelectStation(closestStationInfo.station)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#df8b35] to-[#c57220] text-white font-bold text-xs border border-amber-400/40 shadow-sm transition hover:brightness-110 cursor-pointer"
                    title={`Estación más cercana: ${closestStationInfo.station.ESTACION || 'Estación'} (${closestStationInfo.distanceFormatted})`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="font-mono">
                      {Number(closestStationInfo.station.VALORLECTURA ?? 0).toFixed(1)}°C
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#151922] border border-[#252c3c] text-xs font-bold text-amber-400">
                    <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-mono">{stats.averageTemp}°C</span>
                  </div>
                )}

                {/* Min & Prom (SIDE INFO) */}
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-2xl bg-[#151922] border border-[#252c3c] text-slate-300">
                  <span className="text-[#8a9bb2]">Mín: <strong className="text-blue-300 font-mono">{stats.minTemp}°</strong></span>
                  <span className="text-[#364154]">•</span>
                  <span className="text-[#8a9bb2]">Prom: <strong className="text-white font-mono">{stats.averageTemp}°</strong></span>
                </div>
              </div>
            )}

            {/* HUMEDAD (Sensor 2): Nearest as main, Min & Prom as side info */}
            {currentSensorType === 2 && (
              <div className="flex items-center gap-1.5">
                {/* Nearest (MAIN) */}
                {closestStationInfo && closestStationInfo.station ? (
                  <button
                    type="button"
                    onClick={() => onSelectStation(closestStationInfo.station)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#df8b35] to-[#c57220] text-white font-bold text-xs border border-amber-400/40 shadow-sm transition hover:brightness-110 cursor-pointer"
                    title={`Estación más cercana: ${closestStationInfo.station.ESTACION || 'Estación'} (${closestStationInfo.distanceFormatted})`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="font-mono">
                      {Math.round(Number(closestStationInfo.station.VALORLECTURA ?? closestStationInfo.station.HUMEDAD ?? 0))}%
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-[#151922] border border-[#252c3c] text-xs font-bold text-amber-400">
                    <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="font-mono">{stats.averageHumidity}%</span>
                  </div>
                )}

                {/* Min & Prom (SIDE INFO) */}
                <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-2xl bg-[#151922] border border-[#252c3c] text-slate-300">
                  <span className="text-[#8a9bb2]">Mín: <strong className="text-amber-300 font-mono">{stats.minHumidity}%</strong></span>
                  <span className="text-[#364154]">•</span>
                  <span className="text-[#8a9bb2]">Prom: <strong className="text-white font-mono">{stats.averageHumidity}%</strong></span>
                </div>
              </div>
            )}

            {/* Controls: Refresh */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto md:ml-0">
              {/* Refresh Button */}
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-[#151922] hover:bg-[#1c2230] disabled:opacity-50 text-slate-200 hover:text-white text-xs font-medium border border-[#252c3c] transition cursor-pointer shrink-0"
                title="Refrescar datos meteorológicos IDIGER"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#7e8ea7] ${isLoading ? 'animate-spin text-[#df8b35]' : ''}`} />
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
