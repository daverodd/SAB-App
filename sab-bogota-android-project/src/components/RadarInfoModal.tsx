import React from 'react';
import { X, Radio, Activity, Compass, ShieldCheck } from 'lucide-react';

interface RadarInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RadarInfoModal: React.FC<RadarInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">Radar Meteorológico del IDIGER</h2>
              <span className="text-[11px] text-slate-300">
                Sistema de Monitoreo Atmosférico de Bogotá
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition"
            aria-label="Cerrar modal de información del radar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Main IDIGER Text */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <p className="text-slate-800">
              El <strong>radar meteorológico del IDIGER</strong> es un sensor de última generación
              capaz de detectar partículas de agua suspendidas en la atmósfera. Mediante la emisión
              continua de pulsos electromagnéticos, detecta las gotas de lluvia que están
              precipitando sobre la sabana de Bogotá.
            </p>
            <p className="text-slate-800">
              La información visualizada en el aplicativo corresponde a la{' '}
              <strong>reflectividad del radar</strong>, la cual se asocia directamente con la
              intensidad de precipitación en tiempo real.
            </p>
          </div>

          {/* Key Advantages */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
              <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                <Compass className="w-4 h-4 text-blue-600" />
                <span>Visión Panorámica</span>
              </div>
              <p className="text-blue-800">
                A diferencia de los pluviómetros en tierra, el radar monitorea nubes y frentes de
                tormenta en toda la cuenca antes de que toquen el suelo.
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                <Activity className="w-4 h-4 text-amber-600" />
                <span>Alerta Temprana</span>
              </div>
              <p className="text-amber-800">
                Facilita anticipar posibles crecientes súbitas en los ríos Tunjuelo, Bogotá y Fucha,
                así como eventos de remoción en masa en zonas de ladera.
              </p>
            </div>
          </div>

          {/* Scale breakdown */}
          <div className="space-y-2 pt-1">
            <span className="font-bold text-slate-800 text-xs block">
              Escala de Reflectividad (dBZ) e Interpretación
            </span>
            <div className="bg-slate-900 p-3 rounded-xl text-white">
              <img
                src="/sab-assets/barraRadar.png"
                alt="Escala de reflectividad"
                className="w-full h-auto mb-2 rounded"
              />
              <div className="grid grid-cols-4 text-center text-[10px] text-slate-300 font-medium">
                <div>5 - 20 dBZ: Llovizna leve</div>
                <div>25 - 40 dBZ: Lluvia moderada</div>
                <div>45 - 55 dBZ: Aguacero fuerte</div>
                <div className="text-amber-300">&gt; 55 dBZ: Granizo / Tormenta</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
