import React from "react";
import {
  X,
  MapPin,
  CloudRain,
  Thermometer,
  Droplets,
  Radio,
  Clock,
  Compass,
  Navigation,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  type Station,
  categorizeRainfall,
  formatObservationTime,
  haversineDistance,
} from "../utils/weather-utils";

interface StationDetailModalProps {
  station: Station | null;
  onClose: () => void;
  userCoords: [number, number] | null;
  activeVariable: "lluvias" | "temperatura" | "humedad";
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  userCoords,
  activeVariable,
}) => {
  if (!station) return null;

  const rainInfo = categorizeRainfall(station.ACUMULADODIA || station.VALORLECTURA || 0);
  const distance =
    userCoords && typeof station.LATITUD === "number" && typeof station.LONGITUD === "number"
      ? haversineDistance(userCoords[0], userCoords[1], station.LATITUD, station.LONGITUD)
      : null;

  const valueUnit =
    activeVariable === "lluvias"
      ? "mm"
      : activeVariable === "temperatura"
      ? "°C"
      : "%";

  const mainValue =
    activeVariable === "lluvias"
      ? station.ACUMULADODIA ?? station.VALORLECTURA ?? 0
      : station.VALORLECTURA ?? 0;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-station-title"
      >
        {/* Header with Locality badge */}
        <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner"
              style={{
                backgroundColor: `${rainInfo.hex}20`,
                borderColor: rainInfo.hex,
              }}
            >
              {activeVariable === "lluvias" ? (
                <CloudRain className="w-5 h-5" style={{ color: rainInfo.hex }} />
              ) : activeVariable === "temperatura" ? (
                <Thermometer className="w-5 h-5 text-amber-400" />
              ) : (
                <Droplets className="w-5 h-5 text-teal-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                  {station.LOCALIDAD || "BOGOTÁ D.C."}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ID: #{station.IDESTACION}
                </span>
              </div>
              <h2 id="modal-station-title" className="text-lg font-bold text-white">
                {station.ESTACION}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Cerrar modal de estación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Main Metric Spotlight Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {activeVariable === "lluvias" ? "Acumulado Hoy (desde 00:00)" : "Valor Actual"}
              </span>
              <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
                {mainValue} <span className="text-base text-slate-400 font-sans">{valueUnit}</span>
              </div>
              {activeVariable === "lluvias" && (
                <span
                  className="inline-block text-xs font-bold mt-1 px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${rainInfo.hex}25`,
                    color: rainInfo.hex,
                  }}
                >
                  {rainInfo.label} ({rainInfo.range})
                </span>
              )}
            </div>

            <div className="text-right space-y-1">
              <div className="text-xs text-slate-400">Lectura instantánea:</div>
              <div className="text-base font-bold text-slate-200 font-mono">
                {station.VALORLECTURA ?? 0} {valueUnit}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{formatObservationTime(station.FECHALECTURA)}</span>
              </div>
            </div>
          </div>

          {/* Precipitation Gauge Progress (For Lluvias) */}
          {activeVariable === "lluvias" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Intensidad de precipitación</span>
                <span>{mainValue > 50 ? "Alerta Máxima" : `${Math.min(100, Math.round((mainValue / 50) * 100))}%`}</span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(4, (mainValue / 50) * 100))}%`,
                    backgroundColor: rainInfo.hex,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Seco (0 mm)</span>
                <span>Ligera (10 mm)</span>
                <span>Fuerte (30 mm)</span>
                <span>Torrencial (50+ mm)</span>
              </div>
            </div>
          )}

          {/* Grid of Station Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 block text-[11px] mb-0.5">Estado del Sensor</span>
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{station.ESTADO === 1 ? "Operativo y Transmitiendo" : "En Mantenimiento"}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 block text-[11px] mb-0.5">Tecnología</span>
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>{station.TIPOTECNOLOGIA || "Campbell Scientific"}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 block text-[11px] mb-0.5">Coordenadas</span>
              <div className="font-mono text-slate-300 truncate" title={`${station.LATITUD}, ${station.LONGITUD}`}>
                {Number(station.LATITUD).toFixed(4)}°, {Number(station.LONGITUD).toFixed(4)}°
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <span className="text-slate-400 block text-[11px] mb-0.5">Distancia GPS</span>
              <div className="flex items-center gap-1 font-bold text-cyan-300">
                <Navigation className="w-3.5 h-3.5" />
                <span>{distance !== null ? `${distance} km de ti` : "Activa GPS"}</span>
              </div>
            </div>
          </div>

          {/* Official Institution Stamp */}
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-200 flex items-start gap-2">
            <Compass className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Estación oficial de la Red Hidrometeorológica de Bogotá, administrada por el Instituto Distrital de Gestión de Riesgos y Cambio Climático (IDIGER). Datos en tiempo real.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
