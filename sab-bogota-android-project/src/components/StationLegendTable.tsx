import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  Thermometer,
  CloudRain,
  Droplets,
} from 'lucide-react';
import {
  SABStats,
  RainCategoryKey,
  TempCategoryKey,
  HumidityCategoryKey,
  HUMIDITY_CATEGORIES,
} from '../utils/sabLogic';
import { SensorTypeId } from '../types/sab';

interface StationLegendTableProps {
  currentSensorType: SensorTypeId;
  stats: SABStats;
  selectedCategory: string;
  onSelectCategory: (categoryKey: string) => void;
  onlyRaining: boolean;
  onToggleOnlyRaining: () => void;
  onResetFilters: () => void;
}

// Reusable triangle symbol matching IDIGER's official map triangular indicators
const TriangleSymbol: React.FC<{ color: string; label?: string }> = ({ color, label }) => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 inline-block drop-shadow-xs transition-transform hover:scale-125"
    aria-label={label}
  >
    <polygon
      points="12,3 22,21 2,21"
      fill={color}
      stroke="rgba(0, 0, 0, 0.2)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const StationLegendTable: React.FC<StationLegendTableProps> = ({
  currentSensorType,
  stats,
  selectedCategory,
  onSelectCategory,
  onlyRaining,
  onToggleOnlyRaining,
  onResetFilters,
}) => {
  // Minimized by default per user request
  const [isCollapsed, setIsCollapsed] = useState(true);

  // Rain Categories (Sensor 5)
  const rainCategories: Array<{
    key: RainCategoryKey;
    label: string;
    sublabel: string;
    icon: string;
    count: number;
    color: string;
  }> = [
    {
      key: 'none',
      label: 'Sin Lluvias',
      sublabel: '(0.0 mm)',
      icon: '/sab-assets/TrianguloGris.png',
      count: stats.noneCount,
      color: '#6b7280',
    },
    {
      key: 'low',
      label: 'Acumulados Bajos',
      sublabel: '(0.1 mm - 10 mm)',
      icon: '/sab-assets/TrianguloAzul.png',
      count: stats.lowCount,
      color: '#2563eb',
    },
    {
      key: 'moderate',
      label: 'Acumulados Moderados',
      sublabel: '(10.1 mm - 30 mm)',
      icon: '/sab-assets/TrianguloVerde.png',
      count: stats.moderateCount,
      color: '#16a34a',
    },
    {
      key: 'high',
      label: 'Acumulados Altos',
      sublabel: '(30.1 mm - 50 mm)',
      icon: '/sab-assets/TrianguloNaranja.png',
      count: stats.highCount,
      color: '#ea580c',
    },
    {
      key: 'very_high',
      label: 'Acumulados Muy Altos',
      sublabel: '(> 50.1 mm)',
      icon: '/sab-assets/TrainguloMorado.png',
      count: stats.veryHighCount,
      color: '#7c3aed',
    },
  ];

  // Temperature Categories (Sensor 1)
  const tempCategories: Array<{
    key: TempCategoryKey;
    label: string;
    range: string;
    icon: string;
    count: number;
    color: string;
  }> = [
    { key: 't1', label: 'Helada / Muy Frío', range: '-2°C - 2°C', icon: '/sab-assets/11.png', count: stats.tempCategoryCounts?.t1 || 0, color: '#1e3a8a' },
    { key: 't2', label: 'Frío Intenso', range: '2.1°C - 6°C', icon: '/sab-assets/12.png', count: stats.tempCategoryCounts?.t2 || 0, color: '#2563eb' },
    { key: 't3', label: 'Frío Moderado', range: '6.1°C - 10°C', icon: '/sab-assets/13.png', count: stats.tempCategoryCounts?.t3 || 0, color: '#0284c7' },
    { key: 't4', label: 'Templado Frío', range: '10.1°C - 14°C', icon: '/sab-assets/14.png', count: stats.tempCategoryCounts?.t4 || 0, color: '#0d9488' },
    { key: 't5', label: 'Templado', range: '14.1°C - 18°C', icon: '/sab-assets/15.png', count: stats.tempCategoryCounts?.t5 || 0, color: '#16a34a' },
    { key: 't6', label: 'Cálido', range: '18.1°C - 22°C', icon: '/sab-assets/16.png', count: stats.tempCategoryCounts?.t6 || 0, color: '#ea580c' },
    { key: 't7', label: 'Muy Cálido', range: '22.1°C - 26°C+', icon: '/sab-assets/17.png', count: stats.tempCategoryCounts?.t7 || 0, color: '#dc2626' },
  ];

  // Humidity Categories (Sensor 2)
  const humidityCategories: Array<{
    key: HumidityCategoryKey;
    label: string;
    range: string;
    count: number;
    color: string;
  }> = [
    { key: 'h1', label: HUMIDITY_CATEGORIES.h1.label, range: HUMIDITY_CATEGORIES.h1.rangeLabel, count: stats.humidityCategoryCounts?.h1 || 0, color: HUMIDITY_CATEGORIES.h1.color },
    { key: 'h2', label: HUMIDITY_CATEGORIES.h2.label, range: HUMIDITY_CATEGORIES.h2.rangeLabel, count: stats.humidityCategoryCounts?.h2 || 0, color: HUMIDITY_CATEGORIES.h2.color },
    { key: 'h3', label: HUMIDITY_CATEGORIES.h3.label, range: HUMIDITY_CATEGORIES.h3.rangeLabel, count: stats.humidityCategoryCounts?.h3 || 0, color: HUMIDITY_CATEGORIES.h3.color },
    { key: 'h4', label: HUMIDITY_CATEGORIES.h4.label, range: HUMIDITY_CATEGORIES.h4.rangeLabel, count: stats.humidityCategoryCounts?.h4 || 0, color: HUMIDITY_CATEGORIES.h4.color },
  ];

  const hasFilterActive = selectedCategory !== 'ALL' || (currentSensorType === 5 && onlyRaining);

  const getHeaderIcon = () => {
    switch (currentSensorType) {
      case 1:
        return <Thermometer className="w-4 h-4 text-amber-400" />;
      case 2:
        return <Droplets className="w-4 h-4 text-cyan-400" />;
      case 5:
      default:
        return <CloudRain className="w-4 h-4 text-sky-400" />;
    }
  };

  const getHeaderSublabel = () => {
    switch (currentSensorType) {
      case 1:
        return 'Escala de Temperatura (°C)';
      case 2:
        return 'Escala de Humedad Relativa (%)';
      case 5:
      default:
        return 'Acumulado desde 00:00 hoy (mm)';
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800 overflow-hidden text-xs text-slate-100 transition-all duration-300 w-72 sm:w-80 select-none">
      {/* Title Header - Click to toggle expand/collapse */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="bg-slate-950 text-white px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-900 border-b border-slate-800 transition"
      >
        <div className="flex items-center gap-2">
          {getHeaderIcon()}
          <div>
            <span className="font-bold tracking-wide text-xs block">
              {stats.totalStations} Estaciones IDIGER
            </span>
            <span className="text-[10px] text-slate-400 block font-normal">
              {getHeaderSublabel()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasFilterActive && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-xl text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 font-semibold mr-1">
              Filtro
            </span>
          )}
          <span className="text-[10px] text-slate-400 font-medium">
            {isCollapsed ? 'Leyenda' : ''}
          </span>
          <button
            type="button"
            className="text-slate-400 hover:text-white p-0.5 rounded-xl cursor-pointer"
            title={isCollapsed ? 'Expandir leyenda' : 'Colapsar leyenda'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-2 sm:p-3 space-y-2 max-h-[75vh] overflow-y-auto">
          {/* SENSOR 1: TEMPERATURA */}
          {currentSensorType === 1 && (
            <>
              {/* Extremes summary box */}
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
                <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Mínima</div>
                  <div className="font-extrabold text-blue-400 text-xs">{stats.minTemp} °C</div>
                  <div className="text-[8px] text-slate-400 truncate" title={stats.minTempStation?.LOCALIDAD}>
                    {stats.minTempStation?.LOCALIDAD || 'Bogotá'}
                  </div>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Promedio</div>
                  <div className="font-extrabold text-slate-200 text-xs">{stats.averageTemp} °C</div>
                  <div className="text-[8px] text-slate-400">Distrito Capital</div>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Máxima</div>
                  <div className="font-extrabold text-orange-400 text-xs">{stats.maxTemp} °C</div>
                  <div className="text-[8px] text-slate-400 truncate" title={stats.maxTempStation?.LOCALIDAD}>
                    {stats.maxTempStation?.LOCALIDAD || 'Bogotá'}
                  </div>
                </div>
              </div>

              {/* Table of Temperature Ranges */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-semibold uppercase">
                    <th className="text-left py-1 px-1.5">Rango (°C)</th>
                    <th className="text-center py-1 px-1">Símbolo</th>
                    <th className="text-right py-1 px-1.5">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {tempCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <tr
                        key={cat.key}
                        onClick={() => onSelectCategory(isSelected ? 'ALL' : cat.key)}
                        className={`cursor-pointer transition hover:bg-slate-800/60 ${
                          isSelected ? 'bg-blue-900/30 font-medium' : ''
                        }`}
                      >
                        <td className="py-1.5 px-1.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: cat.color }}
                            ></span>
                            <span>{cat.range}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pl-3.5">{cat.label}</div>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <img
                            src={cat.icon}
                            alt={cat.range}
                            className="w-4 h-4 inline-block drop-shadow-xs transition-transform hover:scale-125"
                          />
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-slate-200">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : cat.count > 0
                                ? 'bg-slate-800 text-slate-200 border border-slate-700/60'
                                : 'text-slate-500'
                            }`}
                          >
                            {cat.count}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* SENSOR 2: HUMEDAD RELATIVA */}
          {currentSensorType === 2 && (
            <>
              {/* Humidity Extremes Summary */}
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/70 rounded-xl border border-slate-800 text-center">
                <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Mínima</div>
                  <div className="font-extrabold text-amber-400 text-xs">{stats.minHumidity}%</div>
                  <div className="text-[8px] text-slate-400 truncate" title={stats.minHumidityStation?.LOCALIDAD}>
                    {stats.minHumidityStation?.LOCALIDAD || 'Bogotá'}
                  </div>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Promedio</div>
                  <div className="font-extrabold text-slate-200 text-xs">{stats.averageHumidity}%</div>
                  <div className="text-[8px] text-slate-400">Distrito Capital</div>
                </div>
                <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <div className="text-[9px] text-slate-400 font-medium">Máxima</div>
                  <div className="font-extrabold text-cyan-400 text-xs">{stats.maxHumidity}%</div>
                  <div className="text-[8px] text-slate-400 truncate" title={stats.maxHumidityStation?.LOCALIDAD}>
                    {stats.maxHumidityStation?.LOCALIDAD || 'Bogotá'}
                  </div>
                </div>
              </div>

              {/* Table of Humidity Ranges with Triangle Shapes */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-semibold uppercase">
                    <th className="text-left py-1 px-1.5">Rango de Humedad</th>
                    <th className="text-center py-1 px-1">Símbolo</th>
                    <th className="text-right py-1 px-1.5">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {humidityCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <tr
                        key={cat.key}
                        onClick={() => onSelectCategory(isSelected ? 'ALL' : cat.key)}
                        className={`cursor-pointer transition hover:bg-slate-800/60 ${
                          isSelected ? 'bg-cyan-950/40 font-medium' : ''
                        }`}
                      >
                        <td className="py-1.5 px-1.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: cat.color }}
                            ></span>
                            <span>{cat.range}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pl-3.5">{cat.label}</div>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <TriangleSymbol color={cat.color} label={cat.label} />
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-slate-200">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-xl text-[11px] ${
                              isSelected
                                ? 'bg-cyan-600 text-white'
                                : cat.count > 0
                                ? 'bg-slate-800 text-slate-200 border border-slate-700/60'
                                : 'text-slate-500'
                            }`}
                          >
                            {cat.count}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* SENSOR 5: LLUVIA (DEFAULT) */}
          {currentSensorType === 5 && (
            <>
              {/* Active Raining Quick Toggle */}
              <button
                type="button"
                onClick={onToggleOnlyRaining}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition cursor-pointer ${
                  onlyRaining
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500'
                    : 'bg-slate-950/80 border-slate-800 text-slate-200 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <img
                      src="/sab-assets/TrianguloAzul.png"
                      alt="Estación con lluvia actual"
                      className="w-4 h-4 inline-block drop-shadow-sm transition-transform hover:scale-125 animate-blink"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-xs flex items-center gap-1.5">
                      <span>Estaciones con lluvia actual</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {stats.activeRainingCount > 0
                        ? `${stats.activeRainingCount} registrando precipitación ahora`
                        : 'Sin lluvias en este minuto'}
                    </div>
                  </div>
                </div>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded-xl text-xs ${
                    stats.activeRainingCount > 0
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {stats.activeRainingCount}
                </span>
              </button>

              {/* Table of Rainfall Categories */}
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-semibold uppercase">
                    <th className="text-left py-1 px-1.5">Nivel / Rango</th>
                    <th className="text-center py-1 px-1">Símbolo</th>
                    <th className="text-right py-1 px-1.5">Cant.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {rainCategories.map((cat) => {
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <tr
                        key={cat.key}
                        onClick={() => onSelectCategory(isSelected ? 'ALL' : cat.key)}
                        className={`cursor-pointer transition hover:bg-slate-800/60 ${
                          isSelected ? 'bg-blue-900/30 font-medium' : ''
                        }`}
                      >
                        <td className="py-1.5 px-1.5">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block shrink-0"
                              style={{ backgroundColor: cat.color }}
                            ></span>
                            <span>{cat.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pl-3.5">{cat.sublabel}</div>
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          <img
                            src={cat.icon}
                            alt={cat.label}
                            className="w-4 h-4 inline-block drop-shadow-sm transition-transform hover:scale-125"
                          />
                        </td>
                        <td className="py-1.5 px-1.5 text-right font-bold text-slate-200">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-xl text-[11px] ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : cat.count > 0
                                ? 'bg-slate-800 text-slate-200 border border-slate-700/60'
                                : 'text-slate-500'
                            }`}
                          >
                            {cat.count}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}

          {/* Filter Reset Button */}
          {hasFilterActive && (
            <button
              type="button"
              onClick={onResetFilters}
              className="w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          )}

          {/* Quick Helper Note */}
          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Haz clic en un rango para filtrar el mapa</span>
            <Filter className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      )}
    </div>
  );
};
