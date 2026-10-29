import React, { useState } from 'react';
import { AlertTriangle, X, PhoneCall, Info, Thermometer } from 'lucide-react';
import { SABStats } from '../utils/sabLogic';
import { SensorTypeId } from '../types/sab';

interface AlertBannerProps {
  stats: SABStats;
  currentSensorType: SensorTypeId;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ stats, currentSensorType }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  if (currentSensorType === 1) {
    // Temperature Mode Banner
    const isColdAlert = stats.minTemp != null && stats.minTemp <= 6;
    const isWarmAlert = stats.maxTemp != null && stats.maxTemp >= 23;

    return (
      <div
        className={`px-4 py-2 text-xs flex items-center justify-between transition-colors border-b z-20 ${
          isColdAlert
            ? 'bg-blue-950/90 border-blue-800 text-blue-200 font-medium'
            : isWarmAlert
            ? 'bg-amber-950/90 border-amber-800 text-amber-200 font-medium'
            : 'bg-slate-900/95 text-slate-200 border-slate-800 font-medium'
        }`}
      >
        <div className="flex items-center gap-2 max-w-5xl overflow-hidden">
          <Thermometer className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="truncate">
            {isColdAlert ? (
              <span>
                <strong>Aviso de Bajas Temperaturas en Bogotá:</strong> Se registran mínimas de{' '}
                <strong>{stats.minTemp} °C en {stats.minTempStation?.LOCALIDAD || 'Bogotá'}</strong>.
                Protéjase del frío, abrigue a menores y adultos mayores.
              </span>
            ) : isWarmAlert ? (
              <span>
                <strong>Aviso de Temperaturas Cálidas:</strong> Registro máximo de{' '}
                <strong>{stats.maxTemp} °C en {stats.maxTempStation?.LOCALIDAD || 'Bogotá'}</strong>.
                Manténgase hidratado y use protección solar.
              </span>
            ) : (
              <span>
                <strong>Monitoreo Térmico Distrital (IDIGER):</strong> Mínima de{' '}
                <strong>{stats.minTemp} °C ({stats.minTempStation?.LOCALIDAD || 'Bogotá'})</strong>,
                Máxima de <strong>{stats.maxTemp} °C ({stats.maxTempStation?.LOCALIDAD || 'Bogotá'})</strong>,
                Promedio de <strong>{stats.averageTemp} °C</strong>.
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-3">
          <a
            href="tel:123"
            className="hidden sm:inline-flex items-center gap-1 font-semibold text-slate-200 hover:text-red-400 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700 text-[11px] transition"
            title="Línea de atención de emergencias distrital"
          >
            <PhoneCall className="w-3 h-3 text-red-500" />
            <span>Emergencias 123</span>
          </a>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-white p-0.5 cursor-pointer transition"
            title="Ocultar aviso"
            aria-label="Cerrar aviso de alerta"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Rain and other variables banner
  const hasHighRain = stats.highCount > 0 || stats.veryHighCount > 0;
  const isRainingActive = stats.activeRainingCount > 0;

  return (
    <div
      className={`px-4 py-2 text-xs flex items-center justify-between transition-colors border-b z-20 ${
        hasHighRain
          ? 'bg-amber-950/90 border-amber-800 text-amber-200 font-medium'
          : isRainingActive
          ? 'bg-cyan-950/90 border-cyan-800 text-cyan-200 font-medium'
          : 'bg-slate-900/95 text-slate-200 border-slate-800 font-medium'
      }`}
    >
      <div className="flex items-center gap-2 max-w-5xl overflow-hidden">
        {hasHighRain ? (
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        ) : isRainingActive ? (
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
        )}

        <div className="truncate">
          {hasHighRain ? (
            <span>
              <strong>Alerta por acumulación de lluvias:</strong> Se registran sectores con
              acumulados superiores a 30 mm (máx:{' '}
              <strong>{stats.maxRainfall} mm en {stats.maxRainStation?.LOCALIDAD}</strong>). Monitoreo
              permanente de cuencas y zonas de ladera por IDIGER.
            </span>
          ) : isRainingActive ? (
            <span>
              <strong>Precipitaciones en curso:</strong> Se reportan lluvias activas en{' '}
              <strong>{stats.activeRainingCount}</strong> estaciones de la red distrital. Conduzca con
              precaución y mantenga limpios los canales y sumideros.
            </span>
          ) : (
            <span>
              <strong>Condición actual en Bogotá D.C.:</strong> Tiempo mayoritariamente seco en la
              red de estaciones del IDIGER. Acumulado máximo del día:{' '}
              <strong>{stats.maxRainfall} mm</strong>.
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3">
        <a
          href="tel:123"
          className="hidden sm:inline-flex items-center gap-1 font-semibold text-slate-200 hover:text-red-400 bg-slate-800/90 px-2.5 py-1 rounded-md border border-slate-700 text-[11px] transition"
          title="Línea de atención de emergencias distrital"
        >
          <PhoneCall className="w-3 h-3 text-red-500" />
          <span>Emergencias 123</span>
        </a>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-slate-400 hover:text-white p-0.5 cursor-pointer transition"
          title="Ocultar aviso"
          aria-label="Cerrar aviso de alerta"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
