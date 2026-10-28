import React from "react";
import { X, PhoneCall, AlertTriangle, ShieldAlert, Waves, Droplet, Mountain, ExternalLink } from "lucide-react";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const contacts = [
    { number: "123", name: "Línea Única de Seguridad y Emergencias", desc: "Bomberos, Policía, Salud, Rescate", color: "text-rose-400", border: "border-rose-500/30" },
    { number: "119", name: "Cuerpo Oficial de Bomberos Bogotá", desc: "Inundaciones, rescates y caídas de árboles", color: "text-amber-400", border: "border-amber-500/30" },
    { number: "116", name: "Acueducto y Alcantarillado de Bogotá", desc: "Taponamiento de sumideros y desbordamientos", color: "text-cyan-400", border: "border-cyan-500/30" },
    { number: "132", name: "Cruz Roja Colombiana Bogotá", desc: "Atención prehospitalaria y apoyo en emergencias", color: "text-rose-300", border: "border-rose-500/30" },
    { number: "144", name: "Defensa Civil Colombiana", desc: "Gestión de desastres y evacuaciones", color: "text-orange-400", border: "border-orange-500/30" },
  ];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="emergency-dialog-title"
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-950/90 via-slate-900 to-slate-900 border-b border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 id="emergency-dialog-title" className="text-base font-bold text-white flex items-center gap-2">
                Líneas de Emergencia • Bogotá D.C.
              </h2>
              <p className="text-xs text-rose-300">
                Atención 24/7 en eventos hidrometeorológicos y riesgos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Cerrar emergencias"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
          {/* Main 123 Card */}
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                Número Principal de Emergencias
              </span>
              <div className="text-3xl font-extrabold text-white font-mono mt-0.5">
                123
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Llamada gratuita desde cualquier operador fijo o celular.
              </p>
            </div>
            <a
              href="tel:123"
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Llamar</span>
            </a>
          </div>

          {/* Directory */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Entidades Distritales de Respuesta
            </h3>
            <div className="grid gap-2">
              {contacts.map((c) => (
                <div
                  key={c.number}
                  className={`p-3 rounded-xl bg-slate-800/60 border ${c.border} flex items-center justify-between gap-3`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-extrabold font-mono ${c.color}`}>
                        {c.number}
                      </span>
                      <span className="text-xs font-bold text-white">{c.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.desc}</p>
                  </div>
                  <a
                    href={`tel:${c.number}`}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold shrink-0 transition"
                    title={`Marcar ${c.number}`}
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Prevention Tips */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs text-slate-300">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Recomendaciones durante lluvias intensas
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              <li>No arrojar basuras a las calles para evitar taponamiento de alcantarillas.</li>
              <li>Evitar transitar por deprimentes viales y pasos a desnivel inundados.</li>
              <li>En cerros orientales y laderas, estar alerta a desprendimientos o grietas.</li>
              <li>Desconectar aparatos electrónicos ante tormentas eléctricas y rayería.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
