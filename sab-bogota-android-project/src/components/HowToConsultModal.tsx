import React from 'react';
import { X, HelpCircle, CheckCircle, Info } from 'lucide-react';

interface HowToConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToConsultModal: React.FC<HowToConsultModalProps> = ({ isOpen, onClose }) => {
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
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-base sm:text-lg font-bold">¿Cómo consultar el SAB?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg bg-white/10 hover:bg-white/20 transition"
            aria-label="Cerrar modal de ayuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Item 1 */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <strong className="text-slate-900 font-semibold block mb-0.5">
                Estaciones de la Red Hidrometeorológica
              </strong>
              <p className="text-slate-600 text-xs">
                Los triángulos sobre el mapa representan estaciones meteorológicas automáticas del
                IDIGER distribuidas estratégicamente a lo largo de las 20 localidades de Bogotá D.C.
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="shrink-0 flex items-center justify-center w-7 h-7">
              <img src="/sab-assets/rain-cloud-animated.svg" alt="Lluvia activa" className="w-7 h-7 object-contain drop-shadow-xs" />
            </div>
            <div>
              <strong className="text-slate-900 font-semibold block mb-0.5">
                Estación con lluvia activa (Precipitación en curso)
              </strong>
              <p className="text-slate-600 text-xs">
                Indica que la estación se encuentra registrando lluvias en este instante (lectura &gt; 0 mm).
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div>
              <strong className="text-slate-900 font-semibold block mb-0.5">
                Colores de Acumulado Diario (desde las 00:00 h)
              </strong>
              <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200">
                  <img src="/sab-assets/TrianguloGris.png" className="w-3.5 h-3.5" alt="" />
                  <span>Sin lluvias (0.0 mm)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200">
                  <img src="/sab-assets/TrianguloAzul.png" className="w-3.5 h-3.5" alt="" />
                  <span>Bajos (0.1 - 10 mm)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200">
                  <img src="/sab-assets/TrianguloVerde.png" className="w-3.5 h-3.5" alt="" />
                  <span>Moderados (10.1 - 30 mm)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200">
                  <img src="/sab-assets/TrianguloNaranja.png" className="w-3.5 h-3.5" alt="" />
                  <span>Altos (30.1 - 50 mm)</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded border border-slate-200 col-span-2">
                  <img src="/sab-assets/TrainguloMorado.png" className="w-3.5 h-3.5" alt="" />
                  <span>Muy Altos (&gt; 50.1 mm)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Item 5 */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-950 font-semibold block mb-0.5">
                Consulta de Registros Históricos de 6 Horas
              </strong>
              <p className="text-blue-900 text-xs">
                Al hacer clic en cualquier estación en el mapa, presiona el botón{' '}
                <strong>"Ver registros"</strong> para examinar la gráfica en intervalos de 5 minutos,
                conocer el acumulado de lluvia acumulado y exportar la serie en formato CSV.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
