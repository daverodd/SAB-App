import React from "react";
import { Info, PhoneCall, X, CloudRain, AlertTriangle } from "lucide-react";
import type { Station } from "../utils/weather-utils";

interface EmergencyBannerProps {
  stats: {
    total: number;
    rainingCount: number;
    maxAcumulado: number;
    maxStation: Station | null;
    localitiesWithRain: string[];
  };
  onOpenEmergencyModal: () => void;
  isVisible: boolean;
  onDismiss: () => void;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  stats,
  onOpenEmergencyModal,
  isVisible,
  onDismiss,
}) => {
  if (!isVisible) return null;

  const hasRain = stats.rainingCount > 0;

  return (
    <div className="bg-[#0b162c]/95 border-b border-blue-900/60 px-3 sm:px-4 py-1.5 text-xs text-slate-200 flex items-center justify-between gap-2 z-20 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 overflow-hidden">
        {hasRain ? (
          <CloudRain className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
        ) : (
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        )}

        <div className="truncate">
          <span className="font-bold text-cyan-300">Condición actual en Bogotá D.C.: </span>
          {hasRain ? (
            <span>
              Precipitaciones detectadas en{" "}
              <strong className="text-amber-300">{stats.rainingCount} estaciones</strong> (
              {stats.localitiesWithRain.slice(0, 3).join(", ") || "Sectores dispersos"}). Acumulado máximo del día:{" "}
              <strong className="text-white font-mono">{stats.maxAcumulado} mm</strong>
              {stats.maxStation ? ` (${stats.maxStation.ESTACION})` : ""}.
            </span>
          ) : (
            <span>
              Tiempo mayoritariamente seco en la red de estaciones del IDIGER. Acumulado máximo del día:{" "}
              <strong className="text-white font-mono">{stats.maxAcumulado} mm</strong>.
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenEmergencyModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 text-xs font-semibold transition"
          aria-label="Emergencias 123"
        >
          <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-bold tracking-wide">Emergencias 123</span>
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition"
          aria-label="Cerrar notificación"
          title="Ocultar barra"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
