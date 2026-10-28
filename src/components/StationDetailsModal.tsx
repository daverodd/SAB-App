import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CloudRain,
  Mountain,
  Cpu,
  Download,
  AlertCircle,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Station, ReadingItem } from '../types/sab';
import { fetchStationReadings } from '../services/sabApi';
import { formatReadingDateTime, classifyRainfall } from '../utils/sabLogic';

interface StationDetailsModalProps {
  station: Station | null;
  onClose: () => void;
}

export const StationDetailsModal: React.FC<StationDetailsModalProps> = ({ station, onClose }) => {
  const [readings, setReadings] = useState<ReadingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    if (!station) return;
    setIsLoading(true);
    fetchStationReadings(station.IDSENSOR, station)
      .then((data) => {
        setReadings(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [station]);

  if (!station) return null;

  const category = classifyRainfall(station.ACUMULADODIA);
  const { date, time } = formatReadingDateTime(station.FECHALECTURA);

  // Calculate summary metrics
  const totalInPeriod = readings.reduce((acc, r) => acc + (Number(r.VALORLECTURA) || 0), 0);
  const maxIntensity = readings.reduce((max, r) => Math.max(max, Number(r.VALORLECTURA) || 0), 0);
  const activeIntervals = readings.filter((r) => Number(r.VALORLECTURA) > 0).length;

  // Last 1 hour rain (last 12 readings)
  const lastHourRain = readings
    .slice(0, 12)
    .reduce((acc, r) => acc + (Number(r.VALORLECTURA) || 0), 0);

  // Prepare chart data (reverse so chronological left-to-right)
  const chronologicalReadings = [...readings].reverse();

  // Export to CSV
  const handleExportCsv = () => {
    const headers = 'Fecha,Hora,Precipitacion_mm,Intervalo_minutos\n';
    const rows = readings
      .map((r) => {
        const dt = formatReadingDateTime(r.FECHALECTURA);
        return `"${dt.date}","${dt.time}",${r.VALORLECTURA},${r.CANTIDAD_MINUTOS}`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stationName = (station.ESTACION || `Sensor_${station.IDSENSOR}`).replace(/\s+/g, '_');
    link.setAttribute('download', `SAB_Estacion_${stationName}_6Horas.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 flex items-start justify-between relative border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                IDIGER • Estación #{station.IDESTACION}
              </span>
              <span className="text-xs text-slate-400">
                Localidad: <strong className="text-white uppercase">{station.LOCALIDAD}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{station.ESTACION}</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition"
            title="Cerrar ventana"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Highlights Strip */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-4 sm:px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span>Acumulado Hoy</span>
            </div>
            <div className="text-lg font-bold text-blue-400 mt-0.5">
              {station.ACUMULADODIA ?? 0} mm
            </div>
            <div className="text-[10px] text-slate-400">{category.label}</div>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Última Hora</span>
            </div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {lastHourRain.toFixed(1)} mm
            </div>
            <div className="text-[10px] text-slate-400">Últimos 60 min</div>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Mountain className="w-3.5 h-3.5 text-emerald-400" />
              <span>Altitud</span>
            </div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {station.ALTITUD || '2600'} msnm
            </div>
            <div className="text-[10px] text-slate-400">Sabana de Bogotá</div>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 shadow-xs">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>Tecnología</span>
            </div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {station.TIPOTECNOLOGIA || 'Campbell'}
            </div>
            <div className="text-[10px] text-slate-400">Sensor {station.TIPOSENSOR}</div>
          </div>
        </div>

        {/* Sub-header Navigation */}
        <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedView('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedView === 'chart'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Gráfica 6 Horas</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedView === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>Tabla de Registros ({readings.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={readings.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 transition"
            title="Descargar datos en CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-900">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="text-xs text-slate-400 font-medium">
                Cargando registros hidrometeorológicos de la estación...
              </div>
            </div>
          ) : selectedView === 'chart' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                <span className="font-semibold text-slate-200">
                  Precipitación registrada en intervalos de 5 minutos (últimas 6 horas)
                </span>
                <span>Pico: {maxIntensity.toFixed(2)} mm</span>
              </div>

              {/* High Quality Responsive SVG Bar Chart */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="relative h-60 w-full flex items-end gap-1 pt-6 pb-6 px-2">
                  {chronologicalReadings.length === 0 ? (
                    <div className="w-full text-center text-xs text-slate-500 my-auto">
                      No hay registros disponibles para el intervalo solicitado.
                    </div>
                  ) : (
                    chronologicalReadings.map((r, idx) => {
                      const val = Number(r.VALORLECTURA) || 0;
                      const maxChartVal = Math.max(maxIntensity, 2);
                      const heightPercent = Math.max((val / maxChartVal) * 100, val > 0 ? 8 : 2);
                      const dt = formatReadingDateTime(r.FECHALECTURA);

                      return (
                        <div
                          key={idx}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative"
                        >
                          {/* Tooltip on bar hover */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                            <div className="bg-slate-950 text-white text-[10px] rounded px-2 py-1 shadow-md whitespace-nowrap border border-slate-700">
                              <div className="font-bold">{dt.time}</div>
                              <div>{val.toFixed(2)} mm</div>
                            </div>
                            <div className="w-2 h-1 bg-slate-950 [clip-path:polygon(0_0,100%_0,50%_100%)]"></div>
                          </div>

                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-sm transition-all duration-200 group-hover:brightness-125 ${
                              val > 0
                                ? 'bg-blue-500 group-hover:bg-blue-400'
                                : 'bg-slate-800'
                            }`}
                          ></div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Timeline X-Axis Labels */}
                <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
                  <span>-6 Horas</span>
                  <span>-4 Horas</span>
                  <span>-2 Horas</span>
                  <span>Hora Actual ({time})</span>
                </div>
              </div>

              {/* Explanatory note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 text-xs text-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  Las lecturas se actualizan automáticamente cada 5 minutos por la red de estaciones
                  automáticas del IDIGER. Los valores representan la lámina de agua de lluvia
                  precipitada en cada intervalo de tiempo.
                </p>
              </div>
            </div>
          ) : (
            /* Table of Records */
            <div className="border border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs divide-y divide-slate-800">
                <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Fecha y Hora</th>
                    <th className="py-2.5 px-3 text-right">Lluvia (mm)</th>
                    <th className="py-2.5 px-3 text-center">Intervalo</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900">
                  {readings.map((r, i) => {
                    const dt = formatReadingDateTime(r.FECHALECTURA);
                    const val = Number(r.VALORLECTURA) || 0;
                    return (
                      <tr key={i} className="hover:bg-slate-800/60 transition">
                        <td className="py-2 px-3 font-medium text-slate-200">
                          {dt.date} <span className="text-slate-400 font-mono">({dt.time})</span>
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-bold ${
                            val > 0 ? 'text-blue-400' : 'text-slate-500'
                          }`}
                        >
                          {val.toFixed(2)} mm
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400">
                          {r.CANTIDAD_MINUTOS} min
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              val > 0
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {val > 0 ? 'Precipitación' : 'Sin lluvia'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-4 sm:px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Fuente: Instituto Distrital de Gestión de Riesgos y Cambio Climático (IDIGER)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
