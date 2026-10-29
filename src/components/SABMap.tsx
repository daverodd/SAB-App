import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Layers,
  Compass,
  Sliders,
  Info,
  Locate,
  LocateFixed,
  Loader2,
  X,
  RefreshCw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Station, SensorTypeId } from '../types/sab';
import { fetchRadarFrames, BUNDLED_RADAR_URL, type RadarFrame } from '../services/radarApi';
import {
  classifyRainfall,
  classifyTemperature,
  classifyHumidity,
  isCurrentlyRaining,
  formatReadingDateTime,
} from '../utils/sabLogic';

interface SABMapProps {
  stations: Station[];
  allStations: Station[];
  currentSensorType: SensorTypeId;
  selectedStation: Station | null;
  onSelectStation: (station: Station | null) => void;
  onOpenStationHistory: (station: Station) => void;
  localidadesGeoJson: any;
  showRadar: boolean;
  onToggleRadar: (show: boolean) => void;
  radarOpacity: number;
  onChangeRadarOpacity: (opacity: number) => void;
  radarNonce?: number;
  onRefreshRadar?: () => void;
  onLocationChange?: (coords: { lat: number; lng: number } | null) => void;
  onLocatingStateChange?: (isLocating: boolean) => void;
  triggerGpsKey?: number;
  radarMode?: 'animated' | 'live';
  onChangeRadarMode?: (mode: 'animated' | 'live') => void;
}

const BASEMAP_TILES: Record<
  string,
  {
    name: string;
    url: string;
    labelsUrl?: string;
    attribution: string;
    subdomains: string;
    className: string;
  }
> = {
  dark: {
    name: 'Oscuro',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labelsUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> &mdash; Esri, DeLorme, NAVTEQ',
    subdomains: 'abc',
    className: 'dark-tiles',
  },
  light: {
    name: 'Claro',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: 'abc',
    className: '',
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &copy; Earthstar Geographics',
    subdomains: 'abc',
    className: '',
  },
};

/**
 * Smooths and anti-aliases the raw 120x120 IDIGER radar reflectivity PNG
 * using multi-pass bicubic upsampling and soft Gaussian filtering to eliminate blocky pixelation
 * while preserving Doppler reflectivity dBZ colors and transparency.
 *
 * Uses same-origin fetch with session credentials to work seamlessly behind Google Cloud authentication proxies.
 */
async function treatRadarImage(rawUrl: string): Promise<string> {
  try {
    const res = await fetch(rawUrl, {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    return await new Promise<string>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const srcW = img.naturalWidth || 120;
          const srcH = img.naturalHeight || 120;

          // Pass 1: Upsample 2x to smooth out nearest-neighbor grid
          const c1 = document.createElement('canvas');
          c1.width = srcW * 2;
          c1.height = srcH * 2;
          const ctx1 = c1.getContext('2d');
          if (!ctx1) {
            URL.revokeObjectURL(blobUrl);
            resolve(blobUrl);
            return;
          }
          ctx1.imageSmoothingEnabled = true;
          ctx1.imageSmoothingQuality = 'high';
          ctx1.drawImage(img, 0, 0, c1.width, c1.height);

          // Pass 2: Upsample to 480x480 with soft Gaussian anti-aliasing
          const targetSize = 480;
          const c2 = document.createElement('canvas');
          c2.width = targetSize;
          c2.height = targetSize;
          const ctx2 = c2.getContext('2d');
          if (!ctx2) {
            URL.revokeObjectURL(blobUrl);
            resolve(blobUrl);
            return;
          }
          ctx2.imageSmoothingEnabled = true;
          ctx2.imageSmoothingQuality = 'high';
          ctx2.filter = 'blur(1.6px)';
          ctx2.drawImage(c1, 0, 0, targetSize, targetSize);
          ctx2.filter = 'none';

          URL.revokeObjectURL(blobUrl);
          resolve(c2.toDataURL('image/png'));
        } catch {
          URL.revokeObjectURL(blobUrl);
          resolve(blobUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(rawUrl);
      };
      img.src = blobUrl;
    });
  } catch (err) {
    console.warn('Could not treat radar image via canvas:', err);
    return rawUrl;
  }
}

export const SABMap: React.FC<SABMapProps> = ({
  stations,
  allStations,
  currentSensorType,
  selectedStation,
  onSelectStation,
  onOpenStationHistory,
  localidadesGeoJson,
  showRadar,
  onToggleRadar,
  radarOpacity,
  onChangeRadarOpacity,
  radarNonce,
  onRefreshRadar,
  onLocationChange,
  onLocatingStateChange,
  triggerGpsKey,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const localidadesLayerRef = useRef<L.GeoJSON | null>(null);
  const radarOverlayRef = useRef<L.ImageOverlay | null>(null);
  const markerByStationIdRef = useRef<Map<number, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userCircleRef = useRef<L.Circle | null>(null);

  const [currentBasemap, setCurrentBasemap] = useState<keyof typeof BASEMAP_TILES>('dark');
  const [showBasemapMenu, setShowBasemapMenu] = useState(false);
  const [showRadarControls, setShowRadarControls] = useState(false);
  const [showLocalidades, setShowLocalidades] = useState(true);
  const [showRadarScale, setShowRadarScale] = useState(false);
  const [radarScanTime, setRadarScanTime] = useState<string>('');
  const [isRadarRefreshing, setIsRadarRefreshing] = useState(false);

  // IDIGER Radar Animation States (from inicio.html)
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [isPlayingRadar, setIsPlayingRadar] = useState<boolean>(false);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [playbackSpeed] = useState<number>(2); // Default to 2x playback speed

  // GPS Location state
  const [isLocating, setIsLocating] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const onLocationChangeRef = useRef(onLocationChange);
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const onLocatingStateChangeRef = useRef(onLocatingStateChange);
  useEffect(() => {
    onLocatingStateChangeRef.current = onLocatingStateChange;
  }, [onLocatingStateChange]);

  // Update parent about locating state
  const setLocatingState = useCallback((locating: boolean) => {
    setIsLocating(locating);
    onLocatingStateChangeRef.current?.(locating);
  }, []);

  // Get current user GPS location and pinpoint on map
  const handleGetLocation = useCallback((shouldCenterAndZoom: boolean = false) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Tu dispositivo o navegador no soporta geolocalización GPS.');
      setTimeout(() => setLocationError(null), 5000);
      return;
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    setLocatingState(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          const rawLat = pos?.coords?.latitude;
          const rawLng = pos?.coords?.longitude;
          const rawAccuracy = pos?.coords?.accuracy;

          const latitude = typeof rawLat === 'number' && !isNaN(rawLat) ? rawLat : null;
          const longitude = typeof rawLng === 'number' && !isNaN(rawLng) ? rawLng : null;

          if (latitude === null || longitude === null) {
            setLocatingState(false);
            setLocationError('No se pudieron leer coordenadas GPS válidas.');
            setTimeout(() => setLocationError(null), 5000);
            return;
          }

          const accuracy =
            typeof rawAccuracy === 'number' && !isNaN(rawAccuracy) && rawAccuracy > 0
              ? Math.max(rawAccuracy, 25)
              : 30;

          setLocatingState(false);
          setHasLocation(true);
          onLocationChangeRef.current?.({ lat: latitude, lng: longitude });

          // Safe clean up of previous user location layers
          try {
            if (userMarkerRef.current && mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(userMarkerRef.current);
            }
          } catch {}
          userMarkerRef.current = null;

          try {
            if (userCircleRef.current && mapInstanceRef.current) {
              mapInstanceRef.current.removeLayer(userCircleRef.current);
            }
          } catch {}
          userCircleRef.current = null;

          // Add accuracy buffer circle safely
          const circle = L.circle([latitude, longitude], {
            radius: accuracy,
            color: '#df8b35',
            weight: 1.5,
            fillColor: '#c87624',
            fillOpacity: 0.15,
          }).addTo(map);
          userCircleRef.current = circle;

          // Custom high-visibility pulsing GPS marker with warm amber styling
          const userIcon = L.divIcon({
            className: 'sab-user-gps-marker',
            html: `
              <div class="relative flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-auto cursor-pointer">
                <span class="absolute inline-flex h-8 w-8 rounded-full bg-[#df8b35] opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-[#c87624] border-2 border-white shadow-lg ring-1 ring-[#df8b35]"></span>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -14],
          });

          const marker = L.marker([latitude, longitude], {
            icon: userIcon,
            zIndexOffset: 1500,
          }).addTo(map);

          marker.bindPopup(`
            <div class="bg-gradient-to-r from-[#171b26] to-[#1e1a16] text-white p-2.5 rounded-t-lg text-center font-bold text-xs flex items-center justify-center gap-1.5 border-b border-[#2d251d]">
              <span class="w-2.5 h-2.5 rounded-full bg-[#df8b35] animate-pulse"></span>
              <span class="text-white">Tu Ubicación GPS Actual</span>
            </div>
            <div class="p-3 bg-[#11141e] text-xs space-y-1.5 text-slate-200">
              <div class="flex justify-between border-b border-[#222938] pb-1">
                <span class="text-[#718096]">Coordenadas:</span>
                <span class="font-mono font-semibold text-slate-100">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span>
              </div>
              <div class="flex justify-between border-b border-[#222938] pb-1">
                <span class="text-[#718096]">Precisión GPS:</span>
                <span class="font-semibold text-[#df8b35]">±${Math.round(accuracy)} m</span>
              </div>
              <div class="text-[10px] text-[#718096] text-center pt-0.5">
                Estás visualizando tu posición respecto a las estaciones IDIGER de Bogotá.
              </div>
            </div>
          `);

          userMarkerRef.current = marker;

          // Calculate distance to Bogotá center (Plaza de Bolívar: 4.62685, -74.0683)
          const R = 6371e3;
          const toRad = (deg: number) => (deg * Math.PI) / 180;
          const dLat = toRad(4.62685 - latitude);
          const dLon = toRad(-74.0683 - longitude);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(latitude)) * Math.cos(toRad(4.62685)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distToBogota = R * c;

          // If the user requested centering
          if (shouldCenterAndZoom) {
            // Check if user is in Bogotá or nearby metropolitan region (within 70 km)
            if (distToBogota <= 70000) {
              // Smoothly pan to location keeping current zoom level intact (no zoom in)
              map.panTo([latitude, longitude], {
                duration: 1.0,
              });

              setTimeout(() => {
                try {
                  if (
                    userMarkerRef.current === marker &&
                    mapInstanceRef.current &&
                    mapInstanceRef.current.hasLayer(marker)
                  ) {
                    marker.openPopup();
                  }
                } catch {}
              }, 1100);
            } else {
              // User is outside Bogotá (e.g. testing from another city or abroad)
              const km = Math.round(distToBogota / 1000);
              setLocationError(
                `Tu GPS está a ${km} km de Bogotá. Mostrando las estaciones del SAB en Bogotá.`
              );
              setTimeout(() => setLocationError(null), 6000);
            }
          }
        } catch (err) {
          console.error('Error handling GPS position:', err);
          setLocatingState(false);
          setLocationError('Error al procesar coordenadas GPS.');
          setTimeout(() => setLocationError(null), 5000);
        }
      },
      (err) => {
        setLocatingState(false);
        let msg = 'No se pudo obtener tu ubicación GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Permiso denegado. Habilita el permiso de ubicación en tu navegador.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Se agotó el tiempo de espera al buscar tu señal GPS.';
        }
        setLocationError(msg);
        setTimeout(() => setLocationError(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 20000,
      }
    );
  }, [setLocatingState, onLocationChange]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial Center matching https://evp.sire.gov.co/radar_animate/inicio.html#11/4.6457/-74.0957
    const initialLat = 4.6457;
    const initialLng = -74.0957;
    const initialZoom = 11;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false,
      minZoom: 9,
      maxZoom: 18,
    });

    // Suppress default Leaflet prefix / flag for a clean UI
    if (map.attributionControl) {
      map.attributionControl.setPrefix(false);
    }

    // Initial Base Tile Layer
    const activeBasemapConfig = BASEMAP_TILES[currentBasemap];
    const tileLayer = L.tileLayer(activeBasemapConfig.url, {
      attribution: activeBasemapConfig.attribution,
      subdomains: activeBasemapConfig.subdomains || 'abc',
      className: activeBasemapConfig.className || '',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Add labels layer if present (e.g. for dark basemap)
    if (activeBasemapConfig.labelsUrl) {
      const labelsLayer = L.tileLayer(activeBasemapConfig.labelsUrl, {
        subdomains: activeBasemapConfig.subdomains || 'abc',
        maxZoom: 19,
      }).addTo(map);
      labelsTileLayerRef.current = labelsLayer;
    }

    // Layer group for station markers
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Automatically activate GPS detection by default (without zooming in)
    handleGetLocation(false);

    return () => {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }
      if (labelsTileLayerRef.current) {
        labelsTileLayerRef.current.remove();
        labelsTileLayerRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      if (userCircleRef.current) {
        userCircleRef.current.remove();
        userCircleRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle external GPS trigger (e.g. from Header badge)
  useEffect(() => {
    if (triggerGpsKey && triggerGpsKey > 0) {
      handleGetLocation(true);
    }
  }, [triggerGpsKey, handleGetLocation]);

  // Update Base Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
    }
    if (labelsTileLayerRef.current) {
      map.removeLayer(labelsTileLayerRef.current);
      labelsTileLayerRef.current = null;
    }

    const activeConfig = BASEMAP_TILES[currentBasemap];
    const newLayer = L.tileLayer(activeConfig.url, {
      attribution: activeConfig.attribution,
      subdomains: activeConfig.subdomains || 'abc',
      className: activeConfig.className || '',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newLayer;

    if (activeConfig.labelsUrl) {
      const newLabels = L.tileLayer(activeConfig.labelsUrl, {
        subdomains: activeConfig.subdomains || 'abc',
        maxZoom: 19,
      }).addTo(map);
      labelsTileLayerRef.current = newLabels;
    }
  }, [currentBasemap]);

  // Update Localidades GeoJSON Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (localidadesLayerRef.current) {
      map.removeLayer(localidadesLayerRef.current);
      localidadesLayerRef.current = null;
    }

    if (showLocalidades && localidadesGeoJson) {
      const isDark = currentBasemap === 'dark';

      const geoLayer = L.geoJSON(localidadesGeoJson, {
        style: {
          color: isDark ? '#df8b35' : '#c57220',
          weight: 1.5,
          opacity: 0.75,
          fillColor: isDark ? '#df8b35' : '#c57220',
          fillOpacity: 0.02,
          dashArray: '4, 4',
        },
        onEachFeature: (feature, layer) => {
          const rawName =
            feature.properties?.NOMBRE ||
            feature.properties?.LocNombre ||
            feature.properties?.nombre ||
            '';
          if (rawName) {
            const formattedName = rawName
              .toLowerCase()
              .split(' ')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ');
            layer.bindTooltip(
              `<span class="font-sans font-semibold text-xs text-slate-300 tracking-wide select-none drop-shadow-sm">${formattedName}</span>`,
              {
                permanent: true,
                direction: 'center',
                className: 'sab-locality-permanent-label',
              }
            );
          }
        },
      }).addTo(map);

      localidadesLayerRef.current = geoLayer;
    }
  }, [localidadesGeoJson, showLocalidades, currentBasemap]);

  // Official IDIGER Leaflet Bounds from inicio.html (main2.js: boundsRadar_IDIGER)
  const IDIGER_RADAR_BOUNDS: L.LatLngBoundsExpression = [
    [4.137996, -74.652930], // south, west
    [5.2123413, -73.575005], // north, east
  ];

  // Fetch Radar Animation Frames list from IDIGER feed
  useEffect(() => {
    let isCancelled = false;

    fetchRadarFrames()
      .then((frames) => ({ frames }))
      .then((data) => {
        if (isCancelled || !data?.frames?.length) return;
        setRadarFrames(data.frames);

        // Preload all 2310x2310 frame images in browser memory for instantaneous flicker-free playback
        data.frames.forEach((f: RadarFrame) => {
          const preImg = new Image();
          preImg.src = f.url;
        });

        // Default to latest frame
        setActiveFrameIndex(data.frames.length - 1);
        const latest = data.frames[data.frames.length - 1];
        if (latest?.label) {
          setRadarScanTime(latest.label);
        }
      })
      .catch((err) => console.warn('Could not load radar frames:', err));

    return () => {
      isCancelled = true;
    };
  }, [radarNonce]);

  // Radar Animation Loop Timer
  useEffect(() => {
    if (!isPlayingRadar || radarFrames.length <= 1) return;

    const intervalMs = Math.round(750 / playbackSpeed);
    const interval = setInterval(() => {
      setActiveFrameIndex((prevIndex) => (prevIndex + 1) % radarFrames.length);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlayingRadar, radarFrames.length, playbackSpeed]);

  // Radar Leaflet Overlay Sync (active in Lluvias, currentSensorType === 5)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!showRadar || currentSensorType !== 5) {
      if (radarOverlayRef.current) {
        map.removeLayer(radarOverlayRef.current);
        radarOverlayRef.current = null;
      }
      return;
    }

    const currentUrl =
      radarFrames.length > 0 && radarFrames[activeFrameIndex]
        ? radarFrames[activeFrameIndex].url
        : BUNDLED_RADAR_URL;

    if (radarOverlayRef.current) {
      radarOverlayRef.current.setUrl(currentUrl);
      radarOverlayRef.current.setOpacity(radarOpacity);
      radarOverlayRef.current.setBounds(L.latLngBounds(IDIGER_RADAR_BOUNDS));
    } else {
      const radarLayer = L.imageOverlay(currentUrl, IDIGER_RADAR_BOUNDS, {
        opacity: radarOpacity,
        interactive: false,
        zIndex: 400,
        className: 'sab-radar-overlay',
      }).addTo(map);

      radarOverlayRef.current = radarLayer;
    }
  }, [showRadar, radarOpacity, currentSensorType, radarFrames, activeFrameIndex, radarNonce]);

  // Update Station Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markerByStationIdRef.current.clear();

    stations.forEach((station) => {
      if (station.LATITUD == null || station.LONGITUD == null) return;

      const { date, time } = formatReadingDateTime(station.FECHALECTURA);

      let customIcon: L.DivIcon | L.Icon;

      if (currentSensorType === 1) {
        // --- TEMPERATURA ---
        const temp = station.VALORLECTURA != null ? Number(station.VALORLECTURA) : null;
        const tempCategory = classifyTemperature(temp);

        customIcon = L.divIcon({
          className: 'sab-station-temp-marker',
          html: `
            <div class="flex items-center gap-1 select-none pointer-events-auto group cursor-pointer -translate-x-2 -translate-y-2">
              <img src="${tempCategory.iconSrc}" style="width: 18px; height: 18px; min-width: 18px; min-height: 18px;" class="shrink-0 drop-shadow-sm group-hover:scale-125 transition-transform" alt="" />
              <span class="bg-[#11141e]/95 text-slate-100 font-extrabold text-xs px-1.5 py-0.5 rounded shadow-lg border border-slate-700/80 whitespace-nowrap leading-tight group-hover:bg-[#161a26] group-hover:border-amber-400/60">
                ${temp != null && !isNaN(temp) ? temp.toFixed(1) : '--'} °C
              </span>
            </div>
          `,
          iconSize: [64, 24],
          iconAnchor: [9, 9],
          popupAnchor: [16, -14],
        });
      } else if (currentSensorType === 2) {
        // --- HUMEDAD RELATIVA (%) (Sensor 2) ---
        const hum = station.VALORLECTURA != null ? Number(station.VALORLECTURA) : 0;
        const humCat = classifyHumidity(hum);

        customIcon = L.divIcon({
          className: 'sab-station-humidity-marker',
          html: `
            <div class="flex items-center gap-1 select-none pointer-events-auto group cursor-pointer -translate-x-2 -translate-y-2">
              <img src="${humCat.iconSrc}" style="width: 18px; height: 18px; min-width: 18px; min-height: 18px;" class="shrink-0 drop-shadow-sm group-hover:scale-125 transition-transform" alt="" />
              <span class="bg-[#11141e]/95 text-slate-100 font-extrabold text-xs px-1.5 py-0.5 rounded shadow-lg border border-slate-700/80 whitespace-nowrap leading-tight group-hover:bg-[#161a26] group-hover:border-amber-400/60">
                ${Math.round(hum)}%
              </span>
            </div>
          `,
          iconSize: [60, 24],
          iconAnchor: [9, 9],
          popupAnchor: [16, -14],
        });
      } else {
        // --- LLUVIAS (PLUVIÓMETROS) (Sensor 5 - Default) ---
        const rainVal = Number(station.ACUMULADODIA) || 0;
        const isRaining = isCurrentlyRaining(station);
        const category = classifyRainfall(rainVal);

        customIcon = L.icon({
          iconUrl: category.iconSrc,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -9],
          className: isRaining
            ? 'transition-transform hover:scale-125 drop-shadow-sm animate-blink'
            : 'transition-transform hover:scale-125 drop-shadow-sm',
        });
      }

      const marker = L.marker([station.LATITUD, station.LONGITUD], {
        icon: customIcon,
        title: station.ESTACION || 'Estación',
        riseOnHover: true,
      });

      // Hover Tooltip
      const valDisplay =
        currentSensorType === 1
          ? `${(Number(station.VALORLECTURA) || 0).toFixed(1)} °C`
          : currentSensorType === 2
          ? `${station.VALORLECTURA ?? 0} %`
          : `Acumulado: ${station.ACUMULADODIA ?? 0} mm`;

      marker.bindTooltip(
        `<div class="p-1 font-sans text-xs bg-[#11141e] text-slate-100 border border-[#252c3c] rounded shadow-lg">
          <div class="font-bold text-white">${station.ESTACION}</div>
          <div class="text-[11px] text-slate-400">${station.LOCALIDAD} • ${time}</div>
          <div class="mt-0.5 font-semibold text-amber-400">${valDisplay}</div>
        </div>`,
        { direction: 'top', offset: [0, -10], opacity: 0.95 }
      );

      // Click on station directly opens the station summary modal (no duplicate popup balloon)
      marker.on('click', () => {
        try {
          marker.closeTooltip();
        } catch {}
        onSelectStation(station);
        onOpenStationHistory(station);
      });

      marker.addTo(markersGroup);
      markerByStationIdRef.current.set(station.IDSENSOR, marker);
    });
  }, [stations, currentSensorType, onSelectStation, onOpenStationHistory]);

  // Focus station when selectedStation changes (preserving current zoom, no unwanted zoom in)
  useEffect(() => {
    if (!selectedStation || !mapInstanceRef.current) return;
    const marker = markerByStationIdRef.current.get(selectedStation.IDSENSOR);
    if (marker && selectedStation.LATITUD != null && selectedStation.LONGITUD != null) {
      const currentZoom = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setView([selectedStation.LATITUD, selectedStation.LONGITUD], currentZoom, {
        animate: true,
      });
      if (!marker.isPopupOpen()) {
        marker.openPopup();
      }
    }
  }, [selectedStation]);

  // Reset view to all Bogotá (matching inicio.html)
  const handleResetView = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([4.6457, -74.0957], 11, { animate: true });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0c0f17]">
      {/* Map DOM Element */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0 outline-none focus:outline-none focus:ring-0 select-none"
        aria-label="Mapa de Bogotá"
      />

      {/* Top Right Map Controls: Basemap, GPS, Reset, and Radar */}
      <div className="absolute top-3 right-3 sm:right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 bg-[#151922]/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-[#252c3c]">
          {/* Basemap Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="p-2 text-[#7f8da4] hover:text-[#df8b35] hover:bg-[#202738] rounded-xl transition cursor-pointer"
              title="Cambiar mapa base"
              aria-label="Cambiar mapa base"
            >
              <Layers className="w-4 h-4" />
            </button>
            {showBasemapMenu && (
              <div className="absolute top-full right-0 mt-2 bg-[#151922]/98 backdrop-blur-md rounded-2xl shadow-2xl border border-[#252c3c] p-2 w-56 z-30 space-y-1">
                <div className="text-[11px] font-bold text-[#8a9bb2] uppercase px-2 py-1 tracking-wider">
                  Capas Base
                </div>
                {Object.entries(BASEMAP_TILES).map(([key, config]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setCurrentBasemap(key as keyof typeof BASEMAP_TILES);
                      setShowBasemapMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                      currentBasemap === key
                        ? 'bg-[#df8b35]/20 text-[#df8b35] font-semibold border border-[#df8b35]/30'
                        : 'text-slate-300 hover:bg-[#202738] hover:text-white'
                    }`}
                  >
                    {config.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS My Location Button */}
          <button
            type="button"
            onClick={() => handleGetLocation(true)}
            disabled={isLocating}
            className={`p-2 rounded-xl transition flex items-center justify-center cursor-pointer ${
              isLocating
                ? 'bg-[#202738] text-[#df8b35] animate-pulse'
                : hasLocation
                ? 'bg-[#222b3c] text-[#df8b35] ring-1 ring-[#df8b35]/40 shadow-xs'
                : 'text-[#7f8da4] hover:text-[#df8b35] hover:bg-[#202738]'
            }`}
            title="Mi ubicación GPS actual"
            aria-label="Obtener mi ubicación GPS"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#df8b35]" />
            ) : hasLocation ? (
              <LocateFixed className="w-4 h-4 text-[#df8b35]" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </button>

          {/* Reset Bogotá Center */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-2 text-[#7f8da4] hover:text-[#df8b35] hover:bg-[#202738] rounded-xl transition cursor-pointer"
            title="Centrar en Bogotá"
            aria-label="Centrar en Bogotá"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Radar Control Toggle */}
          <button
            type="button"
            onClick={() => setShowRadarControls(!showRadarControls)}
            className={`p-2 rounded-xl transition flex items-center gap-1 text-xs cursor-pointer ${
              showRadar
                ? 'bg-[#222b3c] text-[#df8b35] ring-1 ring-[#df8b35]/40 shadow-xs'
                : 'text-[#7f8da4] hover:bg-[#202738] hover:text-white'
            }`}
            title="Ajustes de Radar Meteorológico"
          >
            <Sliders className="w-4 h-4" />
            <span className="font-semibold hidden sm:inline">Radar</span>
          </button>
        </div>

        {/* GPS Location Error Toast */}
        {locationError && (
          <div className="bg-red-950/90 text-white text-xs px-3 py-2 rounded-2xl shadow-xl border border-red-800 max-w-xs animate-fade-in flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-red-300" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Radar Settings Box */}
        {showRadarControls && (
          <div className="bg-[#151922]/98 backdrop-blur-md rounded-2xl shadow-2xl border border-[#252c3c] p-3.5 w-64 text-xs space-y-3 text-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#252c3c]">
              <span className="font-bold text-white">Capa de Radar IDIGER</span>
              <button
                type="button"
                onClick={() => setShowRadarControls(false)}
                className="text-[#718096] hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRadar}
                onChange={(e) => onToggleRadar(e.target.checked)}
                className="rounded text-[#df8b35] focus:ring-[#df8b35] w-4 h-4 bg-[#11141e] border-[#252c3c]"
              />
              <span className="font-medium text-slate-200">Mostrar Reflectividad Radar</span>
            </label>

            {showRadar && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-[#8a9bb2]">
                  <span>Opacidad de la nube:</span>
                  <span className="font-semibold text-[#df8b35]">{Math.round(radarOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={radarOpacity}
                  onChange={(e) => onChangeRadarOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[#df8b35] h-1.5 bg-[#11141e] rounded-lg cursor-pointer"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#252c3c]">
              <input
                type="checkbox"
                checked={showLocalidades}
                onChange={(e) => setShowLocalidades(e.target.checked)}
                className="rounded text-[#df8b35] focus:ring-[#df8b35] w-4 h-4 bg-[#11141e] border-[#252c3c]"
              />
              <span className="font-medium text-slate-200">Polígonos de Localidades</span>
            </label>

            {/* Radar Refresh Controls */}
            <div className="pt-2 border-t border-[#252c3c] space-y-2 text-[11px] text-[#8a9bb2]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#df8b35] animate-pulse"></span>
                  <span>Refresco: <strong className="text-slate-200">En vivo (45s)</strong></span>
                </div>
                {onRefreshRadar && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRadarRefreshing(true);
                      onRefreshRadar();
                      setTimeout(() => setIsRadarRefreshing(false), 1200);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#222b3c] text-[#df8b35] hover:bg-[#2a3449] border border-[#df8b35]/30 font-semibold cursor-pointer transition text-[10px]"
                    title="Refrescar capa de radar ahora"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRadarRefreshing ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                )}
              </div>
              {radarScanTime && (
                <div className="bg-[#11141e] border border-[#252c3c] rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-[#718096]">Último escaneo IDIGER:</span>
                  <span className="font-bold text-[#df8b35]">{radarScanTime}</span>
                </div>
              )}
            </div>

            {/* Reflectivity Scale Preview */}
            <div className="pt-1.5 border-t border-[#252c3c] space-y-2">
              <button
                type="button"
                onClick={() => setShowRadarScale(!showRadarScale)}
                className="w-full flex items-center justify-between text-[11px] text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                <span>Escala Reflectividad (dBZ)</span>
                <span className="text-[10px] text-[#df8b35] font-semibold">
                  {showRadarScale ? 'Ocultar ▲' : 'Ver ▼'}
                </span>
              </button>
              {showRadarScale && (
                <div className="p-1.5 bg-[#11141e] rounded-xl border border-[#252c3c] flex justify-center">
                  <img
                    src="/sab-assets/barraRadar.png"
                    alt="Escala de reflectividad radar IDIGER (dBZ)"
                    className="max-h-48 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Radar Live & Animated Controls (Icon + Time only, matching reference styling) */}
      {showRadar && currentSensorType === 5 && radarFrames.length > 0 && (
        <div className="absolute top-3 left-3 sm:left-4 z-20 pointer-events-auto transition-all duration-200">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#151922]/95 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-[#252c3c] text-slate-100">
            {/* OPTION 1: LIVE (Amber glowing dot + Amber Time) */}
            <button
              type="button"
              onClick={() => {
                setIsLiveMode(true);
                setIsPlayingRadar(false);
                setActiveFrameIndex(radarFrames.length - 1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none shrink-0 ${
                isLiveMode
                  ? 'bg-[#1c2230] text-[#df8b35] border border-[#df8b35]/40 shadow-xs ring-1 ring-[#df8b35]/30'
                  : 'text-[#718096] hover:text-white hover:bg-[#1c2230]'
              }`}
              title={`En vivo: ${radarFrames[radarFrames.length - 1]?.timeStr || radarScanTime || ''}`}
              aria-label="En vivo"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`inline-flex h-full w-full rounded-full bg-[#df8b35] ${isLiveMode ? 'animate-ping opacity-75 absolute' : 'opacity-40'}`}></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#df8b35]"></span>
              </span>
              <span className="font-mono text-xs font-bold text-[#df8b35]">
                {radarFrames[radarFrames.length - 1]?.timeStr || radarScanTime || '--:--'}
              </span>
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-[#262e3e] shrink-0" />

            {/* OPTION 2: ANIMATED (Play Icon + Time) */}
            <button
              type="button"
              onClick={() => {
                if (isLiveMode) {
                  setIsLiveMode(false);
                  setIsPlayingRadar(true);
                } else {
                  setIsPlayingRadar(!isPlayingRadar);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none shrink-0 ${
                !isLiveMode
                  ? 'bg-[#1c2230] text-[#df8b35] border border-[#df8b35]/40 shadow-xs ring-1 ring-[#df8b35]/30'
                  : 'text-[#718096] hover:text-white hover:bg-[#1c2230]'
              }`}
              title={`Animado (2×): ${radarFrames[activeFrameIndex]?.timeStr || ''}`}
              aria-label="Animado"
            >
              {isPlayingRadar ? (
                <Pause className="w-3.5 h-3.5 text-[#df8b35] fill-current shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 text-[#df8b35] fill-current shrink-0" />
              )}
              <span className="font-mono text-xs font-bold text-[#df8b35]">
                {radarFrames[activeFrameIndex]?.timeStr || '--:--'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
