// components/MapControls/ToolPalette.tsx
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  ButtonGroup,
  IconButton,
  Tooltip,
  styled,
  useTheme,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ZoomIn as ZoomInIcon,
  ZoomOutMap as ZoomFullExtentIcon,
  ZoomOut as ZoomOutIcon,
  PanTool as PanToolIcon,
  Straighten as MeasureLineIcon,
  CropSquare as MeasureAreaIcon,
  LocationOn as LocateIcon,
  Layers as LayersIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragHandle as DragHandleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DragHandle,
  CropFree as ZoomMapExtentIcon,
  List as ListIcon,
  Filter as FilterIcon,
  WbSunny as WeatherIcon,
} from "@mui/icons-material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { MeasurementTools } from "./MeasurementTools";
import L, { LatLngBoundsExpression } from "leaflet";
import "leaflet-measure/dist/leaflet-measure.css";
import { LocateToolDialog } from "./LocateToolDialog";
import { MapLayer, WMSLayer, MapLayerControlLayer } from "@/types/map-types";
import { BaseLayerDialog } from "./BaseLayerDialog";
import styles from "./FeaturePopup.module.css";
import proj4 from "proj4";

import ClearIcon from "@mui/icons-material/Clear";
import CheckIcon from "@mui/icons-material/Check";

import { LayerControl } from "./LayerControl";

import FullscreenControl from "react-leaflet-fullscreen";
import "react-leaflet-fullscreen/styles.css";
import { LayerQueryDialog } from "./LayerQueryDialog";

import type { FeatureCollection } from "geojson";
type QueryResult = FeatureCollection;
let cachedProxyConfig: any = null;

async function loadProxyConfig() {
  if (!cachedProxyConfig) {
    const configUrl = process.env.NEXT_PUBLIC_CONFIG_URL || "/config";
    const response = await fetch(`${configUrl}/proxyConfig.json`);
    if (!response.ok) throw new Error("Failed to load proxy config");
    cachedProxyConfig = await response.json();
  }
  return cachedProxyConfig;
}

// Definición para EPSG:3795 (Sistema de Coordenadas de Cuba)
proj4.defs(
  "EPSG:3795",
  "+proj=tmerc +lat_0=21.5 +lon_0=-80.33333333333333 +k=0.99993602 +x_0=500000 +y_0=280296.016 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
);

// Definición para EPSG:4326 (WGS84)
proj4.defs("EPSG:4326", "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs");

// Interfaces para la respuesta de OpenWeatherMap
interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

interface ToolPaletteProps {
  map: L.Map;
  activeLayers: WMSLayer[];
  onToggleLegends?: () => void;
}

let featureMarkers: L.FeatureGroup = L.featureGroup();

const StyledButtonGroup = styled(ButtonGroup)(({ theme }) => ({
  boxShadow: theme.shadows[4],
  borderRadius: "8px",
  overflow: "hidden",
  "& .MuiButton-root": {
    minWidth: "48px",
    height: "48px",
    padding: "8px",
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    borderColor: theme.palette.divider,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    "&.active": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
}));



// Estilos para el marcador de clima
const createWeatherMarker = (weatherData: WeatherData, latLng: L.LatLng) => {
  const icon = L.divIcon({
    className: "weather-marker",
    html: `
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 3px solid white;
        border-radius: 50%;
        width: 60px;
        height: 60px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        text-align: center;
        padding: 4px;
      ">
        <div style="font-size: 10px; margin-bottom: 2px;">${Math.round(
          weatherData.main.temp - 273.15
        )}°C</div>
        <div style="font-size: 8px; opacity: 0.9;">${
          weatherData.weather[0].main
        }</div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });

  return L.marker(latLng, { icon });
};

export const ToolPalette = ({
  map,
  activeLayers,
  onToggleLegends,
}: ToolPaletteProps) => {
  const theme = useTheme();
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [measurementMode, setMeasurementMode] = useState<
    "line" | "area" | null
  >(null);
  const [locateDialogOpen, setLocateDialogOpen] = useState(false);
  const [baseLayerDialogOpen, setBaseLayerDialogOpen] = useState(false);
  const [layerControlOpen, setLayerControlOpen] = useState(false);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [orderedLayers, setOrderedLayers] = useState<WMSLayer[]>([]);
  const [legendsVisible, setLegendsVisible] = useState(true);

  // Estados para el clima - CORREGIDOS
  const [weatherDialogOpen, setWeatherDialogOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherMarker, setWeatherMarker] = useState<L.Marker | null>(null);
  const [weatherMode, setWeatherMode] = useState(false); // Solo un estado para el modo

  const toolbarRef = useRef<HTMLDivElement>(null);

  const weatherModeRef = useRef(weatherMode);

  useEffect(() => {
    weatherModeRef.current = weatherMode;
    console.log("🔄 weatherModeRef actualizado a:", weatherModeRef.current);
  }, [weatherMode]);

  // Función para consultar el clima actual
  const fetchCurrentWeather = async (lat: number, lon: number) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenWeatherMap API key no configurada");
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  };

  // Función principal para obtener datos del clima - CON useCallback
  const getWeatherData = useCallback(
    async (lat: number, lng: number) => {
      try {
        console.log("🌤️ Iniciando consulta de clima para:", lat, lng);

        setWeatherLoading(true);
        setWeatherError(null);
        setWeatherData(null);

        const data = await fetchCurrentWeather(lat, lng);
        console.log("🌤️ Datos del clima recibidos:", data);

        setWeatherData(data);
        setWeatherDialogOpen(true);
        console.log("✅ Diálogo del clima abierto");

        // Limpiar marcador anterior
        if (weatherMarker) {
          map.removeLayer(weatherMarker);
          console.log("🗑️ Marcador anterior removido");
        }

        // Crear nuevo marcador
        const marker = createWeatherMarker(data, L.latLng(lat, lng));
        marker.addTo(map);
        setWeatherMarker(marker);
        console.log("📍 Nuevo marcador de clima agregado");

        // Centrar el mapa en la ubicación
        map.setView([lat, lng], map.getZoom());
        console.log("🗺️ Mapa centrado en ubicación");
      } catch (error) {
        console.error("❌ Error fetching weather data:", error);
        setWeatherError(
          error instanceof Error ? error.message : "Error desconocido"
        );
        setWeatherDialogOpen(true);
      } finally {
        setWeatherLoading(false);
        console.log("🏁 Carga de clima completada");
      }
    },
    [map, weatherMarker]
  );

  const handleWeatherClick = (e: L.LeafletMouseEvent) => {
    // Usar el ref en lugar del estado para obtener el valor actual
    if (!weatherModeRef.current) {
      console.log("❌ Modo clima no activo, ignorando click");
      return;
    }

    console.log("✅ Procesando click para clima - MODO ACTIVO");
    const { lat, lng } = e.latlng;
    getWeatherData(lat, lng);
  };

  // VERSIÓN QUE COPIA EXACTAMENTE handleMeasureClick:
  const toggleWeatherMode = () => {
  

    if (activeTool === "weather") {
      // DESACTIVAR - ya está activo el modo clima
      console.log("🔴 DESACTIVANDO modo clima");
      setActiveTool(null);
      setWeatherMode(false);
      map.off("click", handleWeatherClick);
      map.getContainer().style.cursor = "";
    } else {
      // ACTIVAR - activar modo clima
      console.log("🟢 ACTIVANDO modo clima");
      setActiveTool("weather");
      setWeatherMode(true);

      // Desactivar otras herramientas
      setMeasuring(false);
      setMeasurementMode(null);
      map.dragging.enable();

      // Configurar eventos
      map.off("click", handleWeatherClick);
      map.on("click", handleWeatherClick);
      map.getContainer().style.cursor = "crosshair";
    }
  };

  // Cerrar diálogo de clima - CORREGIDO
  const handleCloseWeatherDialog = () => {
    setWeatherDialogOpen(false);
    // NO desactivamos el modo clima aquí para permitir múltiples consultas
    // El marcador permanece visible
  };

  // Limpiar marcador de clima - CORREGIDO
  const clearWeatherMarker = () => {
    if (weatherMarker) {
      map.removeLayer(weatherMarker);
      setWeatherMarker(null);
    }
    setWeatherData(null);
    setWeatherError("");
    setWeatherDialogOpen(false);
    // NO desactivamos el modo clima para permitir nuevas consultas
  };

  // Función para formatar temperatura
  const formatTemperature = (kelvin: number): string => {
    return `${Math.round(kelvin - 273.15)}°C`;
  };

  // Función para obtener URL del ícono del clima
  const getWeatherIconUrl = (iconCode: string): string => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Función para formatar la dirección del viento
  const formatWindDirection = (degrees: number): string => {
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  const handleQueryComplete = (results: QueryResult) => {
    setQueryResults(results);

    // Mostrar resultados en el mapa
    if (map) {
      // Limpiar resultados anteriores
      map.eachLayer((layer) => {
        if (layer instanceof L.GeoJSON && (layer as any)._queryResult) {
          map.removeLayer(layer);
        }
      });

      // Crear capa con resultados
      const resultLayer = L.geoJSON(results.features, {
        style: {
          color: "#ff0000",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.2,
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties) {
            const popupContent = Object.entries(feature.properties)
              .filter(([key]) => !key.startsWith("__query"))
              .map(([key, value]) => `<b>${key}:</b> ${value}`)
              .join("<br>");

            layer.bindPopup(popupContent);
          }
        },
      }).addTo(map);

      // Marcar como capa de resultados
      (resultLayer as any)._queryResult = true;

      // Zoom a los resultados
      if (results.features.length > 0) {
        map.fitBounds(resultLayer.getBounds(), { padding: [50, 50] });
      }
    }
  };

  useEffect(() => {
    if (!map || !toolbarRef.current) return;

    const toolbarContainer = L.DomUtil.create(
      "div",
      "leaflet-toolbar-container"
    );
    toolbarContainer.style.position = "absolute";
    toolbarContainer.style.top = "10px";
    toolbarContainer.style.right = "10px";
    toolbarContainer.style.zIndex = "1000";

    map.getContainer().appendChild(toolbarContainer);
    toolbarContainer.appendChild(toolbarRef.current);

    console.log("🗂️ Toolbar container creado");

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        toolbarContainer.style.zIndex = "9999";
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      console.log("🧹 Limpiando toolbar");
      console.log(
        "🔍 Estado weatherModeRef al limpiar:",
        weatherModeRef.current
      );

      if (toolbarContainer.parentNode) {
        toolbarContainer.parentNode.removeChild(toolbarContainer);
      }
      document.removeEventListener("fullscreenchange", handleFullscreenChange);

      // Limpiar eventos del mapa
      map.off("click", handleWeatherClick);
      console.log("🗑️ Evento handleWeatherClick removido");

      if (weatherMarker) {
        map.removeLayer(weatherMarker);
      }
    };
  }, [map, weatherMarker]);

  // Función para sincronizar capas
  const syncLayers = () => {
    if (!activeLayers || !Array.isArray(activeLayers)) {
      setOrderedLayers([]);
      return;
    }

    const processedLayers = activeLayers.map((config) => {
      const leafletLayer = L.tileLayer.wms(config.url, {
        layers: config.layers,
        format: config.format || "image/png",
        transparent: config.transparent !== false,
        version: config.version || "1.3.0",
        opacity: config.opacity || 1,
        zIndex: config.zIndex,
        crs: config.crs ? L.CRS.EPSG3857 : undefined,
      });

      if (config.visible !== false) {
        map.addLayer(leafletLayer);
      }

      return {
        ...config,
        id: config.layerId,
        layer: leafletLayer,
        type: "overlay" as const,
        visible: config.visible !== false,
      };
    });

    setOrderedLayers(processedLayers);
  };

  const handleMeasureClick = (mode: "line" | "area") => {
    if (measurementMode === mode) {
      setMeasurementMode(null);
      setActiveTool(null);
      map.dragging.enable();
    } else {
      setMeasurementMode(mode);
      setActiveTool("measure");
      map.dragging.disable();
    }
  };

  // Función para localizar elementos (completamente implementada)
  const handleLocateFeature = async (
    layer: MapLayer,
    field: string,
    value: string
  ) => {
    let loadingIndicator: L.Marker | null = null;

    try {
      // Limpiar marcadores anteriores
      if (map.hasLayer(featureMarkers)) {
        map.removeLayer(featureMarkers);
      }
      featureMarkers = L.featureGroup().addTo(map);

      // Mostrar indicador de carga
      loadingIndicator = L.marker(map.getCenter(), {
        icon: L.divIcon({
          className: "spinner-icon",
          html: '<div class="spinner"></div>',
          iconSize: [40, 40],
        }),
      }).addTo(map);

      if (!layer.options) {
        throw new Error("La capa no tiene opciones configuradas");
      }

      // Función para construir URL WFS correctamente
      const buildWfsUrl = (baseUrl: string): string => {
        if (baseUrl.includes("?")) {
          return baseUrl.includes("service=WFS")
            ? baseUrl
            : baseUrl + (baseUrl.endsWith("?") ? "" : "&") + "service=WFS";
        }

        if (baseUrl.includes("/geoserver/")) {
          return baseUrl.replace("/wms", "/ows") + "?service=WFS";
        }

        return baseUrl.replace("/wms", "/wfs") + "?service=WFS";
      };

      // Determinar la URL WFS base
      let wfsBaseUrl: string | undefined;
      if (layer.type === "WFS") {
        wfsBaseUrl = layer.options.url;
      } else if (layer.type === "WMS") {
        wfsBaseUrl = layer.options.wfsUrl || layer.options.url;
      }

      if (!wfsBaseUrl) {
        throw new Error("No se pudo determinar la URL del servicio WFS");
      }

      // Construir URL WFS completa con parámetros básicos
      const wfsUrl = buildWfsUrl(wfsBaseUrl);

      // Verificar si podemos usar WFS
      const canUseWFS =
        (layer.type === "WFS" || layer.type === "WMS") && wfsUrl;

      if (canUseWFS) {
        await handleWFSLayerSearch(
          layer,
          field,
          value,
          loadingIndicator,
          layer.type === "WMS",
          wfsUrl
        );
      } else if (layer.type === "WMS" && layer.options.url) {
        await handleWMSLayer(layer, field, value, loadingIndicator);
      } else {
        throw new Error(
          "No se puede realizar la búsqueda: configuración no soportada"
        );
      }
    } catch (error) {
      console.error("Error en la búsqueda:", error);
      if (loadingIndicator) {
        map.removeLayer(loadingIndicator);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      const errorMarker = L.marker(map.getCenter(), {
        icon: L.divIcon({
          className: "error-marker",
          html: "<div>⚠️</div>",
          iconSize: [30, 30],
        }),
      }).addTo(featureMarkers);

      errorMarker.bindPopup(`<b>Error:</b> ${errorMessage}`).openPopup();
    }
  };

  const reprojectCoordinates = (
    latLng: L.LatLng,
    fromCrs: string,
    toCrs: string = "EPSG:4326"
  ): L.LatLng => {
    try {
      if (fromCrs === toCrs) {
        return latLng;
      }

      const isProjected =
        Math.abs(latLng.lng) > 180 || Math.abs(latLng.lat) > 90;

      if (isProjected) {
        const point = [latLng.lng, latLng.lat];
        const reprojected = proj4(fromCrs, toCrs, point);
        return L.latLng(reprojected[1], reprojected[0]);
      }

      return latLng;
    } catch (error) {
      console.error("Error en reproyección:", error);
      return latLng;
    }
  };

  // Función auxiliar para aplicar el prefijo del proxy
  const applyProxyPrefix = async (originalUrl: string): Promise<string> => {
    const proxyConfig = await loadProxyConfig();

    const proxy = proxyConfig.proxies.find((p: any) =>
      originalUrl.includes(p.target.replace(/https?:\/\//, ""))
    );

    if (proxy) {
      if (originalUrl.startsWith(proxy.target)) {
        return originalUrl.replace(proxy.target, proxy.prefix);
      }
      if (originalUrl.startsWith(proxy.prefix)) {
        return originalUrl;
      }
    }

    return originalUrl;
  };

  // Función WFS modificada para aceptar la URL construida
  const handleWFSLayerSearch = async (
    layer: MapLayer,
    field: string,
    value: string,
    loadingIndicator: L.Marker | null,
    isWMSLayer: boolean,
    wfsBaseUrl: string
  ) => {
    try {
      const params = new URLSearchParams({
        SERVICE: "WFS",
        VERSION: "1.0.0",
        REQUEST: "GetFeature",
        OUTPUTFORMAT: "application/json",
        TYPENAMES: getLayerNameWithWorkspace(layer),
        CQL_FILTER: buildCqlFilter(field, value),
        SRSNAME: "EPSG:4326",
      });

      const layerCrs = getLayerCrs(layer);
      if (layerCrs && layerCrs !== "EPSG:4326") {
        params.set("SRSNAME", layerCrs);
      }

      const proxiedUrl = await applyProxyPrefix(wfsBaseUrl);
      const url = buildWfsRequestUrl(proxiedUrl, params);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      removeLoadingIndicator(loadingIndicator);

      validateWfsResponse(data, field, value);
      processFeatures(data.features, field, value);
    } catch (error) {
      removeLoadingIndicator(loadingIndicator);
      if (isWMSLayer) {
        console.warn("Falló búsqueda WFS, intentando con GetFeatureInfo...");
        await handleWMSLayer(layer, field, value, loadingIndicator);
      } else {
        throw enhanceError(error, field, value);
      }
    }
  };

  // Funciones auxiliares para WFS/WMS
  const getLayerNameWithWorkspace = (layer: MapLayer): string => {
    return layer.options.workspace
      ? `${layer.options.workspace}:${layer.name}`
      : layer.name;
  };

  const buildCqlFilter = (field: string, value: string): string => {
    const escapedValue = value.replace(/'/g, "''");
    return `${field} LIKE '%${escapedValue}%'`;
  };

  const getLayerCrs = (layer: MapLayer): string | undefined => {
    const crs = layer.crs || layer.options?.crs;
    if (!crs) return undefined;
    return typeof crs === "number" ? `EPSG:${crs}` : crs;
  };

  const buildWfsRequestUrl = (
    baseUrl: string,
    params: URLSearchParams
  ): string => {
    return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${params.toString()}`;
  };

  const removeLoadingIndicator = (indicator: L.Marker | null): void => {
    if (indicator && map.hasLayer(indicator)) {
      map.removeLayer(indicator);
    }
  };

  const validateWfsResponse = (
    data: any,
    field: string,
    value: string
  ): void => {
    if (!data?.features || data.features.length === 0) {
      throw new Error(
        `No se encontraron resultados para "${value}" en el campo "${field}"`
      );
    }
  };

  const processFeatures = (
    features: any[],
    field: string,
    value: string
  ): void => {
    let firstFeature = true;

    for (const feature of features) {
      if (!feature.geometry) continue;

      const featureValue = String(feature.properties[field]);
      const latLng = getFeatureLatLng(feature);

      if (!latLng) continue;

      createFeatureMarker(feature, field, featureValue, latLng, firstFeature);
    }
  };

  const enhanceError = (
    error: unknown,
    field: string,
    value: string
  ): Error => {
    if (error instanceof Error) {
      return new Error(
        `Error al buscar "${value}" en ${field}: ${error.message}`
      );
    }
    return new Error(`Error desconocido al buscar "${value}" en ${field}`);
  };

  const handleWMSLayer = async (
    layer: MapLayer,
    field: string,
    value: string,
    loadingIndicator: L.Marker | null
  ) => {
    const bounds = map.getBounds();
    const size = map.getSize();

    const params = new URLSearchParams();
    params.set("SERVICE", "WMS");
    params.set("VERSION", layer.options.version || "1.3.0");
    params.set("REQUEST", "GetFeatureInfo");
    params.set("FORMAT", "image/png");
    params.set("TRANSPARENT", "true");

    const layerName = layer.options.workspace
      ? `${layer.options.workspace}:${layer.name}`
      : layer.name;
    params.set("LAYERS", layerName);
    params.set("QUERY_LAYERS", layerName);

    params.set("INFO_FORMAT", "application/json");
    params.set("FEATURE_COUNT", "50");
    params.set("WIDTH", String(size.x));
    params.set("HEIGHT", String(size.y));
    params.set("X", String(Math.floor(size.x / 2)));
    params.set("Y", String(Math.floor(size.y / 2)));

    if (params.get("VERSION") === "1.3.0") {
      params.set(
        "BBOX",
        `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`
      );
      params.set("CRS", "EPSG:4326");
    } else {
      params.set(
        "BBOX",
        `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
      );
      params.set("SRS", "EPSG:4326");
    }

    params.set("CQL_FILTER", `${field} LIKE '%${value.replace(/'/g, "''")}%'`);
    let url = `${layer.options.url}?${params.toString()}`;
    let response = await fetch(url);
    let data = await response.json();

    if (!data.features || data.features.length === 0) {
      params.set("CQL_FILTER", `${field} = '${value.replace(/'/g, "''")}'`);
      url = `${layer.options.url}?${params.toString()}`;
      response = await fetch(url);
      data = await response.json();
    }

    if (loadingIndicator) {
      map.removeLayer(loadingIndicator);
    }

    if (!response.ok) {
      throw new Error(data.message || "Error en la respuesta del servidor WMS");
    }

    if (!data.features || data.features.length === 0) {
      throw new Error(
        `No se encontraron resultados para "${value}" en el campo "${field}"`
      );
    }

    const features = data.features;
    let firstFeature = true;

    for (const feature of features) {
      if (!feature.geometry) continue;

      const featureValue = String(feature.properties[field]);
      const latLng = getFeatureLatLng(feature);
      if (!latLng) continue;

      createFeatureMarker(feature, field, featureValue, latLng, firstFeature);
      if (firstFeature) firstFeature = false;
    }
  };

  const getFeatureLatLng = (feature: any): L.LatLng | null => {
    try {
      let coords: [number, number] = [0, 0];

      if (feature.geometry.type === "Point") {
        coords = feature.geometry.coordinates;
      } else {
        const geoJson = L.geoJSON(feature);
        const center = geoJson.getBounds().getCenter();
        coords = [center.lng, center.lat];
      }

      const latLng = L.latLng(coords[1], coords[0]);
      return reprojectCoordinates(latLng, "EPSG:3857", "EPSG:4326");
    } catch (error) {
      console.error("Error al obtener coordenadas del feature:", error);
      return null;
    }
  };

  const createFeatureMarker = (
    feature: any,
    field: string,
    value: string,
    latLng: L.LatLng,
    isFirstFeature: boolean
  ) => {
    if (Math.abs(latLng.lat) > 90 || Math.abs(latLng.lng) > 180) {
      console.error("Coordenadas inválidas:", latLng);
      return null;
    }

    const GEOMETRY_FIELDS = [
      "bbox",
      "geom",
      "geometry",
      "boundingbox",
      "extent",
      "shape",
    ];

    const shouldDisplayField = (key: string): boolean => {
      const lowerKey = key.toLowerCase();
      return (
        !GEOMETRY_FIELDS.includes(lowerKey) &&
        !lowerKey.startsWith("st_") &&
        !lowerKey.endsWith("_geom")
      );
    };

    const formatValue = (value: any): string => {
      if (value === null || value === undefined) return "N/A";
      const strValue = String(value);
      return strValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    };

    const reprojectedLatLng = reprojectCoordinates(
      latLng,
      "EPSG:3795",
      "EPSG:4326"
    );

    const marker = L.marker(reprojectedLatLng, {
      icon: L.divIcon({
        className: styles.featureMarker,
        html: `
            <div class="${styles.modernMarker}">
              <div class="${styles.markerContent}">
                <span class="${styles.markerText}">${formatValue(value)}</span>
                <div class="${styles.markerPulse}"></div>
              </div>
            </div>
          `,
        iconSize: [40, 40],
      }),
      riseOnHover: true,
    }).addTo(featureMarkers);

    marker.bindPopup(() => {
      const filteredProperties = Object.entries(feature.properties || {})
        .filter(([key]) => shouldDisplayField(key))
        .sort(([a], [b]) => a.localeCompare(b));

      const popupContent = [
        `<div class="${styles.modernPopup}">`,
        `  <div class="${styles.popupHeader}">`,
        `    <h3>Información</h3>`,
        `  </div>`,
        `  <div class="${styles.popupContent}">`,
        `    <div class="${styles.popupField} ${styles.popupFieldHighlight}">`,
        `      <span class="${styles.fieldName}">${formatValue(field)}:</span>`,
        `      <span class="${styles.fieldValue}">${formatValue(value)}</span>`,
        `    </div>`,
      ];

      filteredProperties.forEach(([key, val]) => {
        popupContent.push(
          `    <div class="${styles.popupField}">`,
          `      <span class="${styles.fieldName}">${formatValue(key)}:</span>`,
          `      <span class="${styles.fieldValue}">${formatValue(val)}</span>`,
          `    </div>`
        );
      });

      popupContent.push(
        `  </div>`,
        `  <div class="${styles.popupActions}">`,
        `    <button class="${styles.modernButton} ${styles.modernButtonDanger}" `,
        `      onclick="removeMarker(${L.stamp(
          marker
        )}); event.stopPropagation();">`,
        `      <i class="fas fa-trash"></i> Ocultar`,
        `    </button>`,
        `  </div>`,
        `</div>`
      );

      return popupContent.join("\n");
    });

    if (isFirstFeature) {
      map.setView(reprojectedLatLng, 16);
      marker.openPopup();
    }

    return marker;
  };

  // Función global para eliminar marcadores individuales
  (window as any).removeMarker = (markerId: number) => {
    featureMarkers.eachLayer((layer: L.Layer) => {
      if (L.stamp(layer) === markerId) {
        featureMarkers.removeLayer(layer);
      }
    });
  };

  const tools = [
    {
      id: "fullscreen",
      icon: <ZoomFullExtentIcon fontSize="small" />,
      tooltip: "Pantalla completa",
      action: () => {
        const mapContainer = map.getContainer();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          mapContainer.requestFullscreen().catch((err) => {
            console.error("Error al activar pantalla completa:", err);
          });
        }
        setWeatherMode(false);
        map.off("click", handleWeatherClick);
      },
    },
    {
      id: "zoom-full-extent",
      icon: <ZoomMapExtentIcon fontSize="small" />,
      tooltip: "Zoom a extensión completa de Cuba",
      action: () => {
        const cubaBounds: LatLngBoundsExpression = [
          [19.828, -85.167],
          [23.318, -73.933],
        ];

        if (map) {
          map.fitBounds(cubaBounds, {
            padding: [50, 50],
            maxZoom: 8,
          });
        }
        setActiveTool(null);
        setMeasuring(false);
        setLayerControlOpen(false);
        setWeatherMode(false); // Desactivar modo clima
        map.off("click", handleWeatherClick);
      },
    },
    {
      id: "zoom-in",
      icon: <ZoomInIcon fontSize="small" />,
      tooltip: "Zoom in",
      action: () => {
        map.zoomIn();
        setActiveTool(null);
        setMeasuring(false);
        setLayerControlOpen(false);
        setWeatherMode(false); // Desactivar modo clima
        map.off("click", handleWeatherClick);
      },
    },
    {
      id: "zoom-out",
      icon: <ZoomOutIcon fontSize="small" />,
      tooltip: "Zoom out",
      action: () => {
        map.zoomOut();
        setActiveTool(null);
        setMeasuring(false);
        setLayerControlOpen(false);
        setWeatherMode(false); // Desactivar modo clima
        map.off("click", handleWeatherClick);
      },
    },
    {
      id: "pan",
      icon: <PanToolIcon fontSize="small" />,
      tooltip: activeTool === "pan" ? "Desactivar paneo" : "Activar paneo",
      action: () => {
        if (activeTool === "pan") {
          map.dragging.enable();
          setActiveTool(null);
        } else {
          setMeasuring(false);
          setWeatherMode(false); // Desactivar modo clima
          map.off("click", handleWeatherClick);
          map.dragging.enable();
          setActiveTool("pan");
        }
        setLayerControlOpen(false);
      },
    },
    {
      id: "measure-line",
      icon: <MeasureLineIcon fontSize="small" />,
      tooltip:
        measurementMode === "line"
          ? "Detener medición de distancia"
          : "Medir distancia",
      action: () => {
        handleMeasureClick("line");
        setLayerControlOpen(false);
        setWeatherMode(false); // Desactivar modo clima
        map.off("click", handleWeatherClick);
      },
    },
    {
      id: "measure-area",
      icon: <MeasureAreaIcon fontSize="small" />,
      tooltip:
        measurementMode === "area" ? "Detener medición de área" : "Medir área",
      action: () => {
        handleMeasureClick("area");
        setLayerControlOpen(false);
        setWeatherMode(false);
        map.off("click", handleWeatherClick);
      },
    },
    {
      id: "weather",
      icon: weatherLoading ? (
        <CircularProgress size={20} color="inherit" />
      ) : (
        <WeatherIcon fontSize="small" />
      ),
      tooltip: weatherMode
        ? "Desactivar consulta de clima"
        : "Consultar clima actual",
      action: (event: React.MouseEvent) => {
        // 🔥 DETENER la propagación del evento
        event.stopPropagation();
        event.preventDefault();

        console.log(
          "🔘 Botón clima CLICKEADO - weatherMode actual:",
          weatherMode
        );
        console.log("🔘 weatherLoading:", weatherLoading);

        if (!weatherLoading) {
          console.log("✅ Ejecutando toggleWeatherMode...");
          toggleWeatherMode();
        } else {
          console.log("⏳ Weather loading, ignorando click");
        }
      },
    },
    {
      id: "base-layer",
      icon: <LayersIcon fontSize="small" />,
      tooltip: "Cambiar mapa base",
      action: () => {
        setActiveTool(null);
        setMeasuring(false);
        setBaseLayerDialogOpen(true);
        setLayerControlOpen(false);
        setWeatherMode(false); // Desactivar modo clima
        map.off("click", handleWeatherClick);
      },
    },
    {
      id: "locate",
      icon: <LocateIcon fontSize="small" />,
      tooltip: "Localizar elemento en capa",
      action: () => {
        setActiveTool(null);
        setMeasuring(false);
        setLocateDialogOpen(true);
        setLayerControlOpen(false);
        setWeatherMode(false); // Desactivar modo clima
        map.off("click", handleWeatherClick);
      },
    },
  ];

  return (
    <div ref={toolbarRef}>
      <Box
        sx={{
          position: "absolute",
          top: theme.spacing(2),
          right: theme.spacing(2),
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(1),
          backgroundColor: "transparent",
          pointerEvents: "auto",
        }}
      >
        <StyledButtonGroup orientation="vertical" variant="outlined">
          {tools.map(
            (tool) =>
              tool && ( // ← Agrega esta verificación
                <Tooltip
                  key={tool.id}
                  title={tool.tooltip}
                  placement="left"
                  arrow
                >
                  <IconButton
                    onClick={tool.action}
                    className={
                      (activeTool === "pan" && tool.id === "pan") ||
                      (measurementMode === "line" &&
                        tool.id === "measure-line") ||
                      (measurementMode === "area" &&
                        tool.id === "measure-area") ||
                      (tool.id === "locate" && locateDialogOpen) ||
                      (tool.id === "layer-control" && layerControlOpen) ||
                      (tool.id === "toggle-legends" && legendsVisible) ||
                      (tool.id === "weather" && weatherMode)
                        ? "active"
                        : ""
                    }
                    sx={{
                      borderRadius: 0,
                      "&.active": {
                        backgroundColor: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        "&:hover": {
                          backgroundColor: theme.palette.primary.dark,
                        },
                      },
                    }}
                  >
                    {tool.icon}
                  </IconButton>
                </Tooltip>
              )
          )}

          <Tooltip title="Orden de capas" placement="left" arrow>
            <IconButton
              onClick={() => {
                syncLayers();
                setLayerControlOpen(!layerControlOpen);
                setWeatherMode(false); // Desactivar modo clima
                map.off("click", handleWeatherClick);
              }}
              className={layerControlOpen ? "active" : ""}
              sx={{
                borderRadius: 0,
                "&.active": {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                },
              }}
            >
              <LayersIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </StyledButtonGroup>
      </Box>
      <Dialog
        open={weatherDialogOpen}
        onClose={handleCloseWeatherDialog}
        maxWidth="xs" // Más pequeño
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
            background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WeatherIcon />
            <Typography variant="h6" fontWeight="600">
              Clima Actual
            </Typography>
          </Box>
          {weatherData && (
            <Chip
              label={weatherData.name}
              size="small"
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: "500",
              }}
            />
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {weatherLoading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 6,
                gap: 2,
              }}
            >
              <CircularProgress size={50} sx={{ color: "#667eea" }} />
              <Typography
                variant="body1"
                color="text.secondary"
                fontWeight="500"
              >
                Consultando clima...
              </Typography>
            </Box>
          ) : (
            <>
              {weatherError && (
                <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>
                  {weatherError}
                </Alert>
              )}

              {weatherData && (
                <Box sx={{ p: 2 }}>
                  {/* Header compacto con temperatura e ícono */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                      p: 2,
                      background: "white",
                      borderRadius: 2,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  >
                    <Box>
                      <Typography variant="h3" fontWeight="700" color="#2c3e50">
                        {formatTemperature(weatherData.main.temp)}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="#7f8c8d"
                        textTransform="capitalize"
                        fontWeight="500"
                      >
                        {weatherData.weather[0].description}
                      </Typography>
                      <Typography variant="caption" color="#95a5a6">
                        Sensación{" "}
                        {formatTemperature(weatherData.main.feels_like)}
                      </Typography>
                    </Box>
                    <img
                      src={getWeatherIconUrl(weatherData.weather[0].icon)}
                      alt={weatherData.weather[0].description}
                      style={{ width: 70, height: 70 }}
                    />
                  </Box>

                  {/* Grid compacto de métricas */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    {/* Humedad */}
                    <Box
                      sx={{
                        p: 1.5,
                        background: "white",
                        borderRadius: 2,
                        textAlign: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="#7f8c8d"
                        display="block"
                        fontWeight="500"
                      >
                        💧 Humedad
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="#2c3e50"
                      >
                        {weatherData.main.humidity}%
                      </Typography>
                    </Box>

                    {/* Viento */}
                    <Box
                      sx={{
                        p: 1.5,
                        background: "white",
                        borderRadius: 2,
                        textAlign: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="#7f8c8d"
                        display="block"
                        fontWeight="500"
                      >
                        💨 Viento
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="#2c3e50"
                      >
                        {weatherData.wind.speed} m/s
                      </Typography>
                      <Typography variant="caption" color="#95a5a6">
                        {formatWindDirection(weatherData.wind.deg)}
                      </Typography>
                    </Box>

                    {/* Presión */}
                    <Box
                      sx={{
                        p: 1.5,
                        background: "white",
                        borderRadius: 2,
                        textAlign: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="#7f8c8d"
                        display="block"
                        fontWeight="500"
                      >
                        📊 Presión
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="#2c3e50"
                      >
                        {weatherData.main.pressure} hPa
                      </Typography>
                    </Box>

                    {/* Nubosidad */}
                    <Box
                      sx={{
                        p: 1.5,
                        background: "white",
                        borderRadius: 2,
                        textAlign: "center",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="#7f8c8d"
                        display="block"
                        fontWeight="500"
                      >
                        ☁️ Nubes
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="600"
                        color="#2c3e50"
                      >
                        {weatherData.clouds.all}%
                      </Typography>
                    </Box>
                  </Box>

                  {/* Rango de temperatura */}
                  <Box
                    sx={{
                      p: 2,
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: 2,
                      color: "white",
                      textAlign: "center",
                      mb: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ opacity: 0.9 }}
                    >
                      Rango de temperatura
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 3,
                        mt: 0.5,
                      }}
                    >
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ opacity: 0.9 }}
                        >
                          Mín
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {formatTemperature(weatherData.main.temp_min)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: "1px",
                          background: "rgba(255,255,255,0.3)",
                        }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ opacity: 0.9 }}
                        >
                          Máx
                        </Typography>
                        <Typography variant="body2" fontWeight="600">
                          {formatTemperature(weatherData.main.temp_max)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Información de ubicación compacta */}
                  <Box
                    sx={{
                      p: 1.5,
                      background: "rgba(255,255,255,0.5)",
                      borderRadius: 2,
                      textAlign: "center",
                    }}
                  >
                    <Typography variant="caption" color="#7f8c8d">
                      📍 {weatherData.coord.lat.toFixed(3)},{" "}
                      {weatherData.coord.lon.toFixed(3)}
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
            {/* Botón Limpiar - Siempre visible cuando hay datos */}
            {weatherData && (
              <Button
                onClick={clearWeatherMarker}
                variant="outlined"
                size="small"
                sx={{
                  borderRadius: 2,
                  borderColor: "#ff6b6b",
                  color: "#ff6b6b",
                  "&:hover": {
                    borderColor: "#ee5a24",
                    background: "rgba(255, 107, 107, 0.04)",
                  },
                }}
                startIcon={<ClearIcon />}
              >
                Quitar Marcador
              </Button>
            )}

            {/* Botón Cerrar */}
            <Button
              onClick={handleCloseWeatherDialog}
              variant="contained"
              size="small"
              sx={{
                borderRadius: 2,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                flex: 1,
              }}
              startIcon={<CheckIcon />}
            >
              {weatherData ? "Continuar" : "Cerrar"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      {/* Los demás componentes (dialogs, etc.) se mantienen igual */}
      {measurementMode && (
        <MeasurementTools
          map={map}
          active={!!measurementMode}
          mode={measurementMode}
        />
      )}
      <LocateToolDialog
        open={locateDialogOpen}
        onClose={() => setLocateDialogOpen(false)}
        map={map}
        onLocate={handleLocateFeature}
      />
      <BaseLayerDialog
        open={baseLayerDialogOpen}
        onClose={() => setBaseLayerDialogOpen(false)}
        map={map}
      />
      {layerControlOpen && (
        <LayerControl
          map={map}
          layers={orderedLayers}
          onLayersChange={setOrderedLayers}
          onClose={() => setLayerControlOpen(false)}
        />
      )}
    </div>
  );
};
