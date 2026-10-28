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
    className: '',
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
            color: '#2563eb',
            weight: 1.5,
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
          }).addTo(map);
          userCircleRef.current = circle;

          // Custom high-visibility pulsing GPS marker
          const userIcon = L.divIcon({
            className: 'sab-user-gps-marker',
            html: `
              <div class="relative flex items-center justify-center w-8 h-8 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-auto cursor-pointer">
                <span class="absolute inline-flex h-8 w-8 rounded-full bg-blue-500 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 border-2 border-white shadow-lg"></span>
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
            <div class="bg-blue-900 text-white p-2 rounded-t-lg text-center font-bold text-xs flex items-center justify-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Tu Ubicación GPS Actual</span>
            </div>
            <div class="p-2.5 bg-slate-900 text-xs space-y-1.5 text-slate-200">
              <div class="flex justify-between border-b border-slate-800 pb-1">
                <span class="text-slate-400">Coordenadas:</span>
                <span class="font-mono font-semibold text-slate-100">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span>
              </div>
              <div class="flex justify-between border-b border-slate-800 pb-1">
                <span class="text-slate-400">Precisión GPS:</span>
                <span class="font-semibold text-emerald-400">±${Math.round(accuracy)} m</span>
              </div>
              <div class="text-[10px] text-slate-400 text-center pt-0.5">
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

    if (localidadesGeoJson && showLocalidades) {
      const isDark = currentBasemap === 'dark';
      const geoLayer = L.geoJSON(localidadesGeoJson, {
        style: {
          color: isDark ? '#38bdf8' : '#0284c7',
          weight: 1.5,
          opacity: 0.75,
          fillColor: '#0284c7',
          fillOpacity: 0.06,
          dashArray: '3, 4',
        },
        onEachFeature: (feature, layer) => {
          const locName =
            feature.properties?.NOMBRE ||
            feature.properties?.LocNombre ||
            feature.properties?.nombre ||
            'Localidad';
          layer.bindTooltip(
            `<span class="font-sans font-semibold text-xs text-slate-100">${locName}</span>`,
            {
              sticky: true,
              direction: 'center',
              className: 'sab-locality-tooltip',
            }
          );
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
      let popupContent = '';

      if (currentSensorType === 1) {
        // --- TEMPERATURA ---
        const temp = station.VALORLECTURA != null ? Number(station.VALORLECTURA) : null;
        const tempCategory = classifyTemperature(temp);

        customIcon = L.divIcon({
          className: 'sab-station-temp-marker',
          html: `
            <div class="flex items-center gap-1 select-none pointer-events-auto group cursor-pointer -translate-x-3 -translate-y-3">
              <img src="${tempCategory.iconSrc}" class="w-5 h-5 object-contain shrink-0 drop-shadow-sm group-hover:scale-125 transition-transform" alt="" />
              <span class="bg-slate-950/95 text-slate-100 font-extrabold text-xs px-1.5 py-0.5 rounded shadow-lg border border-slate-700/80 whitespace-nowrap leading-tight group-hover:bg-slate-900 group-hover:border-blue-400">
                ${temp != null && !isNaN(temp) ? temp.toFixed(1) : '--'} °C
              </span>
            </div>
          `,
          iconSize: [64, 24],
          iconAnchor: [12, 12],
          popupAnchor: [16, -14],
        });

        popupContent = `
          <div class="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-2.5 rounded-t-lg text-center border-b border-slate-800">
            <div class="font-bold text-sm leading-tight text-white">Estación ${station.ESTACION}</div>
            <div class="text-xs text-blue-400 font-medium tracking-wide uppercase mt-0.5">${station.LOCALIDAD}</div>
          </div>
          <div class="p-3 space-y-1.5 text-xs bg-slate-900 text-slate-200">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Fecha y Hora:</span>
              <span class="font-semibold text-slate-100">${date} (${time})</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Temperatura actual:</span>
              <span class="font-extrabold text-blue-400 text-base">${temp != null ? temp.toFixed(1) : '--'} °C</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Sensación / Rango:</span>
              <span class="font-semibold px-2 py-0.5 rounded text-[11px]" style="background-color: ${tempCategory.bgColor}; color: ${tempCategory.color}; border: 1px solid ${tempCategory.borderColor}">
                ${tempCategory.label} (${tempCategory.rangeLabel})
              </span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Altitud:</span>
              <span class="font-medium text-slate-200">${station.ALTITUD || '2600'} msnm</span>
            </div>
          </div>
        `;
      } else if (currentSensorType === 2) {
        // --- HUMEDAD RELATIVA (%) (Sensor 2) ---
        const hum = station.VALORLECTURA != null ? Number(station.VALORLECTURA) : 0;
        const humCat = classifyHumidity(hum);

        customIcon = L.divIcon({
          className: 'sab-station-humidity-marker',
          html: `
            <div class="flex items-center gap-1 select-none pointer-events-auto group cursor-pointer -translate-x-3 -translate-y-3">
              <svg viewBox="0 0 24 24" class="w-5 h-5 drop-shadow-sm group-hover:scale-125 transition-transform shrink-0" fill="${humCat.color}">
                <polygon points="12,3 22,21 2,21" stroke="rgba(0,0,0,0.25)" stroke-width="1.2" stroke-linejoin="round" />
              </svg>
              <span class="bg-slate-950/95 text-slate-100 font-extrabold text-xs px-1.5 py-0.5 rounded shadow-lg border border-slate-700/80 whitespace-nowrap leading-tight group-hover:bg-slate-900 group-hover:border-cyan-400">
                ${hum.toFixed(0)}%
              </span>
            </div>
          `,
          iconSize: [60, 24],
          iconAnchor: [12, 12],
          popupAnchor: [16, -14],
        });

        popupContent = `
          <div class="bg-gradient-to-r from-slate-900 to-cyan-950 p-2.5 rounded-t-lg border-b border-slate-800 text-center">
            <div class="font-bold text-sm text-white leading-tight">Estación ${station.ESTACION}</div>
            <div class="text-xs text-cyan-400 font-semibold tracking-wide uppercase mt-0.5">${station.LOCALIDAD}</div>
          </div>
          <div class="p-3 space-y-1.5 text-xs bg-slate-900 text-slate-200">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Fecha y Hora:</span>
              <span class="font-semibold text-slate-100">${date} (${time})</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Humedad relativa:</span>
              <span class="font-extrabold text-cyan-400 text-base">${hum.toFixed(1)} %</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Rango / Categoría:</span>
              <span class="font-semibold px-2 py-0.5 rounded text-[11px] text-white" style="background-color: ${humCat.color}">
                ${humCat.label} (${humCat.rangeLabel})
              </span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Tecnología:</span>
              <span class="font-medium text-slate-200">${station.TIPOTECNOLOGIA || 'Campbell'}</span>
            </div>
          </div>
        `;
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

        popupContent = `
          <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-2.5 rounded-t-lg border-b border-slate-800 text-center">
            <div class="font-bold text-sm text-white leading-tight">Estación ${station.ESTACION}</div>
            <div class="text-xs text-blue-400 font-semibold tracking-wide uppercase mt-0.5">${station.LOCALIDAD}</div>
          </div>
          <div class="p-3 space-y-1.5 text-xs bg-slate-900 text-slate-200">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Última lectura:</span>
              <span class="font-semibold text-slate-100">${date} (${time})</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Acumulado de hoy:</span>
              <span class="font-bold text-blue-400 text-sm">${station.ACUMULADODIA ?? 0} mm</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Lluvia en tiempo real:</span>
              <span class="font-semibold ${isRaining ? 'text-cyan-400 font-bold' : 'text-slate-200'}">
                ${station.VALORLECTURA ?? 0} mm ${isRaining ? '(Lloviendo)' : ''}
              </span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Altitud:</span>
              <span class="font-medium text-slate-200">${station.ALTITUD || '2600'} msnm</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Tecnología:</span>
              <span class="font-medium text-slate-200">${station.TIPOTECNOLOGIA || 'Campbell'}</span>
            </div>
          </div>
        `;
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
        `<div class="p-1 font-sans text-xs bg-slate-900 text-slate-100">
          <div class="font-bold text-white">${station.ESTACION}</div>
          <div class="text-[11px] text-slate-400">${station.LOCALIDAD} • ${time}</div>
          <div class="mt-0.5 font-semibold text-blue-400">${valDisplay}</div>
        </div>`,
        { direction: 'top', offset: [0, -10], opacity: 0.95 }
      );

      // Complete Popup DOM
      const popupDiv = document.createElement('div');
      popupDiv.className = 'sab-popup font-sans text-slate-100 p-0 text-xs w-64 bg-slate-900';
      popupDiv.innerHTML = `
        ${popupContent}
        <div class="p-2.5 bg-slate-950 rounded-b-lg border-t border-slate-800 flex justify-center">
          <button id="btn-ver-registros-${station.IDSENSOR}" class="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
            <span>Ver registros (6 Horas)</span>
          </button>
        </div>
      `;

      popupDiv.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('button');
        if (target && target.id.startsWith('btn-ver-registros')) {
          onOpenStationHistory(station);
        }
      });

      marker.bindPopup(popupDiv, { maxWidth: 280 });

      marker.on('popupopen', () => {
        onSelectStation(station);
        const btn = document.getElementById(`btn-ver-registros-${station.IDSENSOR}`);
        if (btn) {
          btn.onclick = () => {
            onOpenStationHistory(station);
          };
        }
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
    <div className="relative w-full h-full overflow-hidden bg-slate-100">
      {/* Map DOM Element */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0 outline-none focus:outline-none focus:ring-0 select-none"
        aria-label="Mapa de Bogotá"
      />

      {/* Top Right Map Controls: Basemap, GPS, Reset, and Radar */}
      <div className="absolute top-3 right-3 sm:right-4 z-20 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl shadow-xl border border-slate-800">
          {/* Basemap Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBasemapMenu(!showBasemapMenu)}
              className="p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title="Cambiar mapa base"
              aria-label="Cambiar mapa base"
            >
              <Layers className="w-4 h-4" />
            </button>
            {showBasemapMenu && (
              <div className="absolute top-full right-0 mt-2 bg-slate-900/98 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800 p-2 w-56 z-30 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase px-2 py-1 tracking-wider">
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
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
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
                ? 'bg-blue-900/50 text-blue-300 animate-pulse'
                : hasLocation
                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                : 'text-slate-300 hover:text-blue-400 hover:bg-slate-800'
            }`}
            title="Mi ubicación GPS actual"
            aria-label="Obtener mi ubicación GPS"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : hasLocation ? (
              <LocateFixed className="w-4 h-4 text-white" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </button>

          {/* Reset Bogotá Center */}
          <button
            type="button"
            onClick={handleResetView}
            className="p-2 text-slate-300 hover:text-blue-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
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
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Ajustes de Radar Meteorológico"
          >
            <Sliders className="w-4 h-4" />
            <span className="font-semibold hidden sm:inline">Radar</span>
          </button>
        </div>

        {/* GPS Location Error Toast */}
        {locationError && (
          <div className="bg-red-900/90 text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-red-700 max-w-xs animate-fade-in flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0 text-red-300" />
            <span>{locationError}</span>
          </div>
        )}

        {/* Radar Settings Box */}
        {showRadarControls && (
          <div className="bg-slate-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-800 p-3 w-64 text-xs space-y-3 text-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="font-bold text-white">Capa de Radar IDIGER</span>
              <button
                type="button"
                onClick={() => setShowRadarControls(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRadar}
                onChange={(e) => onToggleRadar(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-800 border-slate-700"
              />
              <span className="font-medium text-slate-200">Mostrar Reflectividad Radar</span>
            </label>

            {showRadar && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Opacidad de la nube:</span>
                  <span className="font-semibold text-blue-400">{Math.round(radarOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={radarOpacity}
                  onChange={(e) => onChangeRadarOpacity(parseFloat(e.target.value))}
                  className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-800">
              <input
                type="checkbox"
                checked={showLocalidades}
                onChange={(e) => setShowLocalidades(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-800 border-slate-700"
              />
              <span className="font-medium text-slate-200">Polígonos de Localidades</span>
            </label>

            {/* Radar Refresh Controls */}
            <div className="pt-2 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-blue-900/40 text-blue-300 hover:bg-blue-800/60 border border-blue-700/50 font-semibold cursor-pointer transition text-[10px]"
                    title="Refrescar capa de radar ahora"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRadarRefreshing ? 'animate-spin' : ''}`} />
                    <span>Actualizar</span>
                  </button>
                )}
              </div>
              {radarScanTime && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-2 py-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Último escaneo IDIGER:</span>
                  <span className="font-bold text-cyan-400">{radarScanTime}</span>
                </div>
              )}
            </div>

            {/* Reflectivity Scale Preview */}
            <div className="pt-1.5 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setShowRadarScale(!showRadarScale)}
                className="w-full flex items-center justify-between text-[11px] text-slate-300 hover:text-white font-medium cursor-pointer"
              >
                <span>Escala Reflectividad (dBZ)</span>
                <span className="text-[10px] text-blue-400 font-semibold">
                  {showRadarScale ? 'Ocultar ▲' : 'Ver ▼'}
                </span>
              </button>
              {showRadarScale && (
                <div className="p-1.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-center">
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

      {/* Radar Live & Animated Controls (Icon + Time only, no text, not expanding) */}
      {showRadar && currentSensorType === 5 && radarFrames.length > 0 && (
        <div className="absolute top-3 left-3 sm:left-4 z-20 pointer-events-auto transition-all duration-200">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl shadow-xl border border-slate-800 text-slate-100">
            {/* OPTION 1: LIVE (Icon + Time only) */}
            <button
              type="button"
              onClick={() => {
                setIsLiveMode(true);
                setIsPlayingRadar(false);
                setActiveFrameIndex(radarFrames.length - 1);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none shrink-0 ${
                isLiveMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`En vivo: ${radarFrames[radarFrames.length - 1]?.timeStr || radarScanTime || ''}`}
              aria-label="En vivo"
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`inline-flex h-full w-full rounded-full bg-emerald-400 ${isLiveMode ? 'animate-ping opacity-75 absolute' : 'opacity-40'}`}></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs font-bold text-emerald-300">
                {radarFrames[radarFrames.length - 1]?.timeStr || radarScanTime || '--:--'}
              </span>
            </button>

            {/* Separator */}
            <div className="h-5 w-px bg-slate-800 shrink-0" />

            {/* OPTION 2: ANIMATED (Icon + Time only) */}
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none shrink-0 ${
                !isLiveMode
                  ? 'bg-blue-600/20 text-blue-200 border border-blue-500/40 shadow-xs ring-1 ring-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`Animado (2×): ${radarFrames[activeFrameIndex]?.timeStr || ''}`}
              aria-label="Animado"
            >
              {isPlayingRadar ? (
                <Pause className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
              ) : (
                <Play className="w-3.5 h-3.5 text-cyan-400 fill-current shrink-0" />
              )}
              <span className="font-mono text-xs font-bold text-cyan-300">
                {radarFrames[activeFrameIndex]?.timeStr || '--:--'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
