import React from 'react';
import {
  X,
  Clock,
  CloudRain,
  Mountain,
  Cpu,
  Thermometer,
  Droplets,
  MapPin,
  CheckCircle2,
  Radio,
} from 'lucide-react';
import { Station, SensorTypeId } from '../types/sab';
import {
  formatReadingDateTime,
  classifyRainfall,
  classifyTemperature,
  classifyHumidity,
  isCurrentlyRaining,
} from '../utils/sabLogic';

interface StationDetailsModalProps {
  station: Station | null;
  currentSensorType?: SensorTypeId;
  onClose: () => void;
}

export const StationDetailsModal: React.FC<StationDetailsModalProps> = ({
  station,
  currentSensorType = 5,
  onClose,
}) => {
  if (!station) return null;

  const { date, time } = formatReadingDateTime(station.FECHALECTURA);

  const isTemp = currentSensorType === 1;
  const isHum = currentSensorType === 2;
  const isRain = !isTemp && !isHum;

  const rainingNow = isCurrentlyRaining(station);
  const rainCategory = classifyRainfall(station.ACUMULADODIA);
  const tempCategory = classifyTemperature(Number(station.VALORLECTURA));
  const humCategory = classifyHumidity(Number(station.VALORLECTURA ?? station.HUMEDAD));

  const stationId = station.IDESTACION || station.IDSENSOR;
  const stationName = station.ESTACION || `Estación ${stationId}`;
  const localidad = station.LOCALIDAD || 'Bogotá D.C.';
  const lat = station.LATITUD != null ? Number(station.LATITUD).toFixed(5) : '--';
  const lng = station.LONGITUD != null ? Number(station.LONGITUD).toFixed(5) : '--';
  const altitud = station.ALTITUD || '2600';
  const tecnologia = station.TIPOTECNOLOGIA || 'Campbell Scientific';
  const tipoSensor = station.TIPOSENSOR || 'IDIGER';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#10141f] rounded-2xl shadow-2xl border border-[#252c3c] w-full max-w-lg flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-[#0c0f17] text-white p-4 sm:p-5 flex items-start justify-between relative border-b border-[#1f2636]">
          <div className="pr-3">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                IDIGER • #{stationId}
              </span>
              <span className="text-xs text-[#8a9bb2] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#df8b35]" />
                <strong className="text-white uppercase">{localidad}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
              {stationName}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-[#161a26] hover:bg-[#202738] border border-[#252c3c] transition cursor-pointer shrink-0"
            title="Cerrar ventana"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Station Summary Information */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[75vh] bg-[#0e121a]">
          {/* Main Reading Highlight Card */}
          <div className="bg-gradient-to-br from-[#161b28] to-[#121620] rounded-2xl p-4 border border-[#283144] shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8a9bb2]">
                {isRain ? (
                  <CloudRain className="w-4 h-4 text-[#df8b35]" />
                ) : isTemp ? (
                  <Thermometer className="w-4 h-4 text-[#df8b35]" />
                ) : (
                  <Droplets className="w-4 h-4 text-[#df8b35]" />
                )}
                <span>
                  {isRain ? 'Precipitación y Lluvias' : isTemp ? 'Temperatura Ambiente' : 'Humedad Relativa'}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>En Línea</span>
              </div>
            </div>

            {isRain ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b0e15]/80 p-3 rounded-xl border border-[#1f2636]">
                  <div className="text-[11px] text-[#8a9bb2]">Acumulado hoy (00:00 - ahora)</div>
                  <div className="text-2xl font-extrabold text-[#df8b35] mt-1 font-mono">
                    {station.ACUMULADODIA ?? 0} <span className="text-sm font-sans font-medium text-slate-300">mm</span>
                  </div>
                  <div className="text-[11px] text-[#8a9bb2] mt-1">
                    {rainCategory.label}
                  </div>
                </div>

                <div className="bg-[#0b0e15]/80 p-3 rounded-xl border border-[#1f2636]">
                  <div className="text-[11px] text-[#8a9bb2]">Estado actual</div>
                  <div className="text-2xl font-extrabold text-slate-100 mt-1 font-mono">
                    {station.VALORLECTURA ?? 0} <span className="text-sm font-sans font-medium text-slate-300">mm</span>
                  </div>
                  <div className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${rainingNow ? 'text-[#df8b35]' : 'text-slate-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${rainingNow ? 'bg-[#df8b35] animate-ping' : 'bg-slate-500'}`} />
                    <span>{rainingNow ? 'Lloviendo ahora' : 'Sin lluvia actual'}</span>
                  </div>
                </div>
              </div>
            ) : isTemp ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b0e15]/80 p-3 rounded-xl border border-[#1f2636]">
                  <div className="text-[11px] text-[#8a9bb2]">Temperatura actual</div>
                  <div className="text-2xl font-extrabold text-[#df8b35] mt-1 font-mono">
                    {station.VALORLECTURA != null ? Number(station.VALORLECTURA).toFixed(1) : '--'}
                    <span className="text-sm font-sans font-medium text-slate-300"> °C</span>
                  </div>
                  <div className="text-[11px] text-[#8a9bb2] mt-1 font-medium">
                    {tempCategory.label}
                  </div>
                </div>

                <div className="bg-[#0b0e15]/80 p-3 rounded-xl border border-[#1f2636]">
                  <div className="text-[11px] text-[#8a9bb2]">Rango térmico</div>
                  <div className="text-sm font-bold text-slate-200 mt-2">
                    {tempCategory.rangeLabel}
                  </div>
                  <div className="text-[11px] text-[#8a9bb2] mt-1">
                    Escala oficial IDIGER
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0b0e15]/80 p-3 rounded-xl border border-[#1f2636]">
                  <div className="text-[11px] text-[#8a9bb2]">Humedad relativa</div>
                  <div className="text-2xl font-extrabold text-[#df8b35] mt-1 font-mono">
                    {Math.round(Number(station.VALORLECTURA ?? station.HUMEDAD ?? 0))}
                    <span className="text-sm font-sans font-medium text-slate-300"> %</span>
                  </div>
                  <div className="text-[11px] text-[#8a9bb2] mt-1 font-medium">
                    {humCategory.label}
                  </div>
                </div>

                <div className="bg-[#0b0e15]/80 p-3 rounded-xl border border-[#1f2636]">
                  <div className="text-[11px] text-[#8a9bb2]">Rango de saturación</div>
                  <div className="text-sm font-bold text-slate-200 mt-2">
                    {humCategory.rangeLabel}
                  </div>
                  <div className="text-[11px] text-[#8a9bb2] mt-1">
                    Humedad del aire
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Technical & Location Telemetry Details Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Altitud */}
            <div className="bg-[#121622] p-3 rounded-xl border border-[#1f2636]">
              <div className="text-[11px] text-[#8a9bb2] flex items-center gap-1.5 font-medium">
                <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                <span>Altitud</span>
              </div>
              <div className="text-base font-bold text-slate-100 mt-1 font-mono">
                {altitud} <span className="text-xs font-sans text-slate-400 font-normal">msnm</span>
              </div>
              <div className="text-[10px] text-[#718096] mt-0.5">Sabana de Bogotá</div>
            </div>

            {/* Coordenadas */}
            <div className="bg-[#121622] p-3 rounded-xl border border-[#1f2636]">
              <div className="text-[11px] text-[#8a9bb2] flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Coordenadas</span>
              </div>
              <div className="text-xs font-mono font-bold text-slate-100 mt-1">
                {lat}, {lng}
              </div>
              <div className="text-[10px] text-[#718096] mt-0.5">WGS84 GPS</div>
            </div>

            {/* Tecnología */}
            <div className="bg-[#121622] p-3 rounded-xl border border-[#1f2636]">
              <div className="text-[11px] text-[#8a9bb2] flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#df8b35]" />
                <span>Tecnología</span>
              </div>
              <div className="text-xs font-semibold text-slate-200 mt-1 truncate">
                {tecnologia}
              </div>
              <div className="text-[10px] text-[#718096] mt-0.5">Sensor: {tipoSensor}</div>
            </div>

            {/* Última Lectura */}
            <div className="bg-[#121622] p-3 rounded-xl border border-[#1f2636]">
              <div className="text-[11px] text-[#8a9bb2] flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>Último Reporte</span>
              </div>
              <div className="text-xs font-bold text-slate-100 mt-1 font-mono">
                {time}
              </div>
              <div className="text-[10px] text-[#718096] mt-0.5 truncate">{date}</div>
            </div>
          </div>

          {/* Operational Quality Badge */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#121622] border border-[#1f2636] text-xs text-[#8a9bb2]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Estación telemétrica oficial de la red SAB (Sistema de Alerta de Bogotá - IDIGER).
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#0c0f17] px-4 sm:px-5 py-3 border-t border-[#1f2636] flex items-center justify-between text-xs text-[#718096]">
          <span>IDIGER • Alcaldía Mayor de Bogotá</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#161a26] hover:bg-[#202738] text-slate-200 border border-[#252c3c] font-medium transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
