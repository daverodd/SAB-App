import React, { useState, useMemo } from "react";
import {
  X,
  Search,
  Filter,
  MapPin,
  CloudRain,
  ChevronRight,
  ArrowUpDown,
  Navigation,
} from "lucide-react";
import {
  type Station,
  categorizeRainfall,
  haversineDistance,
} from "../utils/weather-utils";

interface StationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  onSelectStation: (station: Station) => void;
  activeVariable: "lluvias" | "temperatura" | "humedad";
  userCoords: [number, number] | null;
}

export const StationsDrawer: React.FC<StationsDrawerProps> = ({
  isOpen,
  onClose,
  stations,
  onSelectStation,
  activeVariable,
  userCoords,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "raining" | "dry">("all");
  const [sortBy, setSortBy] = useState<"name" | "rain" | "locality" | "distance">("rain");

  const filteredStations = useMemo(() => {
    let list = [...stations];

    // Text Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.ESTACION?.toLowerCase().includes(q) ||
          s.LOCALIDAD?.toLowerCase().includes(q) ||
          String(s.IDESTACION).includes(q)
      );
    }

    // Status Filter
    if (filterMode === "raining") {
      list = list.filter((s) => (s.ACUMULADODIA || 0) > 0.1 || (s.VALORLECTURA || 0) > 0.1);
    } else if (filterMode === "dry") {
      list = list.filter((s) => (s.ACUMULADODIA || 0) <= 0.1 && (s.VALORLECTURA || 0) <= 0.1);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "rain") {
        return (b.ACUMULADODIA || 0) - (a.ACUMULADODIA || 0);
      }
      if (sortBy === "name") {
        return (a.ESTACION || "").localeCompare(b.ESTACION || "");
      }
      if (sortBy === "locality") {
        return (a.LOCALIDAD || "").localeCompare(b.LOCALIDAD || "");
      }
      if (sortBy === "distance" && userCoords) {
        const distA = haversineDistance(userCoords[0], userCoords[1], a.LATITUD, a.LONGITUD);
        const distB = haversineDistance(userCoords[0], userCoords[1], b.LATITUD, b.LONGITUD);
        return distA - distB;
      }
      return 0;
    });

    return list;
  }, [stations, searchTerm, filterMode, sortBy, userCoords]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-[2000] w-full max-w-md bg-slate-900/98 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Red de Estaciones IDIGER</h2>
            <p className="text-xs text-slate-400">
              {filteredStations.length} de {stations.length} estaciones
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label="Cerrar panel de estaciones"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-3 border-b border-slate-800 space-y-2.5 bg-slate-950/40">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por estación o localidad..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Borrar
            </button>
          )}
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filterMode === "all"
                ? "bg-blue-600 text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Todas ({stations.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("raining")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filterMode === "raining"
                ? "bg-amber-600 text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Con Lluvia
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("dry")}
            className={`px-2.5 py-1 rounded-lg font-medium transition ${
              filterMode === "dry"
                ? "bg-slate-700 text-white font-bold"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            Secas
          </button>

          {/* Sort Selector */}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <ArrowUpDown className="w-3 h-3" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="rain">Mayor lluvia</option>
              <option value="name">Nombre</option>
              <option value="locality">Localidad</option>
              {userCoords && <option value="distance">Distancia GPS</option>}
            </select>
          </div>
        </div>
      </div>

      {/* Station List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
        {filteredStations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No se encontraron estaciones con los criterios especificados.
          </div>
        ) : (
          filteredStations.map((s) => {
            const rainInfo = categorizeRainfall(s.ACUMULADODIA || 0);
            const dist =
              userCoords && typeof s.LATITUD === "number" && typeof s.LONGITUD === "number"
                ? haversineDistance(userCoords[0], userCoords[1], s.LATITUD, s.LONGITUD)
                : null;

            return (
              <button
                key={s.IDSENSOR || s.IDESTACION}
                type="button"
                onClick={() => {
                  onSelectStation(s);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-800/80 transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border mt-0.5"
                    style={{
                      backgroundColor: `${rainInfo.hex}20`,
                      borderColor: rainInfo.hex,
                    }}
                  >
                    <CloudRain className="w-4 h-4" style={{ color: rainInfo.hex }} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                        {s.LOCALIDAD || "BOGOTÁ"}
                      </span>
                      {dist !== null && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          • {dist} km
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition">
                      {s.ESTACION}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <div className="text-sm font-extrabold font-mono text-white">
                      {s.ACUMULADODIA ?? 0} <span className="text-[10px] text-slate-400">mm</span>
                    </div>
                    <div
                      className="text-[10px] font-semibold"
                      style={{ color: rainInfo.hex }}
                    >
                      {rainInfo.label}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
