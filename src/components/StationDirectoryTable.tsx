import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  MapPin,
  BarChart2,
  CloudRain,
  Thermometer,
  RotateCcw,
} from 'lucide-react';
import { Station, SensorTypeId } from '../types/sab';
import {
  classifyRainfall,
  classifyTemperature,
  isCurrentlyRaining,
  formatReadingDateTime,
} from '../utils/sabLogic';

interface StationDirectoryTableProps {
  stations: Station[];
  currentSensorType: SensorTypeId;
  onSelectStationOnMap: (station: Station) => void;
  onOpenStationHistory: (station: Station) => void;
}

type SortField =
  | 'ESTACION'
  | 'LOCALIDAD'
  | 'ACUMULADODIA'
  | 'VALORLECTURA'
  | 'HUMEDAD'
  | 'ALTITUD'
  | 'FECHALECTURA';

export const StationDirectoryTable: React.FC<StationDirectoryTableProps> = ({
  stations,
  currentSensorType,
  onSelectStationOnMap,
  onOpenStationHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocality, setSelectedLocality] = useState('TODAS');
  const [selectedTechnology, setSelectedTechnology] = useState('TODAS');
  const [onlyRaining, setOnlyRaining] = useState(false);
  const [sortField, setSortField] = useState<SortField>(
    currentSensorType === 1 ? 'VALORLECTURA' : 'ACUMULADODIA'
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Unique localities list
  const localities = useMemo(() => {
    const set = new Set<string>();
    stations.forEach((s) => {
      if (s.LOCALIDAD) set.add(s.LOCALIDAD.trim());
    });
    return Array.from(set).sort();
  }, [stations]);

  // Unique technologies
  const technologies = useMemo(() => {
    const set = new Set<string>();
    stations.forEach((s) => {
      if (s.TIPOTECNOLOGIA) set.add(s.TIPOTECNOLOGIA.trim());
    });
    return Array.from(set).sort();
  }, [stations]);

  // Filtering & Sorting
  const filteredStations = useMemo(() => {
    return stations
      .filter((s) => {
        if (currentSensorType === 5 && onlyRaining && !isCurrentlyRaining(s)) return false;
        if (selectedLocality !== 'TODAS' && s.LOCALIDAD?.toUpperCase() !== selectedLocality) {
          return false;
        }
        if (selectedTechnology !== 'TODAS' && s.TIPOTECNOLOGIA !== selectedTechnology) {
          return false;
        }
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matches =
            s.ESTACION?.toLowerCase().includes(q) ||
            s.LOCALIDAD?.toLowerCase().includes(q) ||
            String(s.IDESTACION).includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    stations,
    searchTerm,
    selectedLocality,
    selectedTechnology,
    onlyRaining,
    sortField,
    sortDirection,
    currentSensorType,
  ]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedLocality('TODAS');
    setSelectedTechnology('TODAS');
    setOnlyRaining(false);
  };

  const getMetricHeaderTitle = () => {
    switch (currentSensorType) {
      case 1:
        return 'Temperatura Actual';
      case 2:
        return 'Humedad Relativa';
      default:
        return 'Acumulado Hoy';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top Controls Card */}
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {currentSensorType === 1 ? (
                  <Thermometer className="w-5 h-5 text-amber-400" />
                ) : (
                  <CloudRain className="w-5 h-5 text-blue-400" />
                )}
                <span>
                  Directorio de Estaciones IDIGER ({currentSensorType === 1 ? 'Temperatura' : 'Red Meteorológica'})
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Visualizando {filteredStations.length} de {stations.length} estaciones
              </p>
            </div>

            {/* Quick Filter Active Lloviendo (only in rain mode) */}
            {currentSensorType === 5 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyRaining(!onlyRaining)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    onlyRaining
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <CloudRain className="w-4 h-4 text-cyan-400" />
                  <span>Solo Lloviendo Ahora</span>
                </button>
              </div>
            )}
          </div>

          {/* Search and Dropdowns Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por estación o localidad..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

            {/* Locality Dropdown */}
            <div>
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODAS">Todas las Localidades ({localities.length})</option>
                {localities.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Technology Dropdown */}
            <div>
              <select
                value={selectedTechnology}
                onChange={(e) => setSelectedTechnology(e.target.value)}
                className="w-full py-2 px-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODAS">Todas las Tecnologías</option>
                {technologies.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            <div>
              <button
                type="button"
                onClick={resetFilters}
                className="w-full py-2 px-3 text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer Filtros</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stations Table */}
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-800">
              <thead className="bg-slate-950 text-slate-300 font-bold uppercase text-[10px] tracking-wider select-none">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => handleSort('ESTACION')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Estación</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => handleSort('LOCALIDAD')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Localidad</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => handleSort(currentSensorType === 1 ? 'VALORLECTURA' : 'ACUMULADODIA')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{getMetricHeaderTitle()}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  {currentSensorType === 1 ? (
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition"
                      onClick={() => handleSort('HUMEDAD')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Humedad Relativa</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  ) : (
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:bg-slate-800 transition"
                      onClick={() => handleSort('VALORLECTURA')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Lluvia Actual</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => handleSort('ALTITUD')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Altitud</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:bg-slate-800 transition"
                    onClick={() => handleSort('FECHALECTURA')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Última Lectura</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900">
                {filteredStations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No se encontraron estaciones que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredStations.map((station) => {
                    const { date, time } = formatReadingDateTime(station.FECHALECTURA);

                    if (currentSensorType === 1) {
                      // Temperature Mode Display
                      const temp =
                        station.VALORLECTURA != null ? Number(station.VALORLECTURA) : NaN;
                      const cat = classifyTemperature(temp);
                      const isNormalTemp = !isNaN(temp) && temp < 50 && temp > -20;

                      return (
                        <tr key={station.IDSENSOR} className="hover:bg-slate-800/60 transition">
                          {/* Name & ID */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <img src={cat.iconSrc} alt="" className="w-5 h-5 shrink-0 object-contain" />
                              <div>
                                <div className="font-bold text-white">{station.ESTACION}</div>
                                <div className="text-[10px] text-slate-400">
                                  ID #{station.IDESTACION} • {station.TIPOTECNOLOGIA}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Localidad */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-300 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded text-[11px]">
                              {station.LOCALIDAD}
                            </span>
                          </td>

                          {/* Temperature Reading */}
                          <td className="py-3 px-3 text-right">
                            <div className="font-extrabold text-blue-400 text-sm">
                              {isNormalTemp ? `${temp.toFixed(1)} °C` : 'N/A'}
                            </div>
                            <div className="text-[10px] text-slate-400">{cat.label}</div>
                          </td>

                          {/* Humidity */}
                          <td className="py-3 px-3 text-right">
                            <span className="font-semibold text-cyan-400 text-xs">
                              {station.HUMEDAD != null ? `${station.HUMEDAD} %` : 'N/A'}
                            </span>
                          </td>

                          {/* Altitude */}
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">
                            {station.ALTITUD || '2600'} m
                          </td>

                          {/* Last Reading Date/Time */}
                          <td className="py-3 px-3 text-slate-400">
                            <div className="font-medium text-slate-200">{time}</div>
                            <div className="text-[10px] text-slate-500">{date}</div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectStationOnMap(station)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                                title="Ver en el mapa"
                              >
                                <MapPin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenStationHistory(station)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                                title="Ver histórico 6 horas"
                              >
                                <BarChart2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    // Default: Rain Mode Display
                    const rain = Number(station.ACUMULADODIA) || 0;
                    const isRaining = isCurrentlyRaining(station);
                    const category = classifyRainfall(rain);

                    return (
                      <tr key={station.IDSENSOR} className="hover:bg-slate-800/60 transition">
                        {/* Name & ID */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={isRaining ? '/sab-assets/rain-cloud-animated.svg' : category.iconSrc}
                              alt=""
                              className="w-5 h-5 shrink-0 object-contain drop-shadow-xs"
                            />
                            <div>
                              <div className="font-bold text-white">{station.ESTACION}</div>
                              <div className="text-[10px] text-slate-400">
                                ID #{station.IDESTACION} • {station.TIPOTECNOLOGIA}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Localidad */}
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-300 bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded text-[11px]">
                            {station.LOCALIDAD}
                          </span>
                        </td>

                        {/* Accumulated Rain */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-blue-400 text-sm">
                            {rain.toFixed(1)} mm
                          </div>
                          <div className="text-[10px] text-slate-400">{category.label}</div>
                        </td>

                        {/* Real-time Current Rain */}
                        <td className="py-3 px-3 text-right">
                          {isRaining ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                              <CloudRain className="w-3 h-3 text-cyan-400 animate-pulse" />
                              <span>{station.VALORLECTURA} mm</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">0.0 mm</span>
                          )}
                        </td>

                        {/* Altitude */}
                        <td className="py-3 px-3 text-center text-slate-400 font-mono">
                          {station.ALTITUD || '2600'} m
                        </td>

                        {/* Last Reading Date/Time */}
                        <td className="py-3 px-3 text-slate-400">
                          <div className="font-medium text-slate-200">{time}</div>
                          <div className="text-[10px] text-slate-500">{date}</div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSelectStationOnMap(station)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                              title="Ver en el mapa"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenStationHistory(station)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                              title="Ver histórico 6 horas"
                            >
                              <BarChart2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
