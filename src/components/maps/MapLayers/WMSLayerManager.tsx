// components/MapLayers/WMSLayerManager.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";

// Interfaces
export interface LegendInfo {
  layerId: string;
  serviceId: string;
  layerType: string;
  isVisible: boolean;
}

export interface TransformedLegend {
  layerId: string;
  serviceId: string;
  layerType: string;
  title: string;
  gradient: Array<{ color: string; value: string }>;
  description?: string;
  source?: string;
  isFallback?: boolean;
}

interface WMSLayerManagerProps {
  map: L.Map | null;
  activeLayers: Array<any>;
  loading: boolean;
  infoMode: boolean;
  activeInfoLayer?: any;
  onError?: (message: string) => void;
  setFeatureInfo: (info: any) => void;
  setOpenDialog: (open: boolean) => void;
  setLayersLoading: (loading: boolean) => void;
  onLegendUpdate?: (legends: LegendInfo[]) => void;
}

// 🔥 CONFIGURACIONES DE LEYENDAS MEJORADAS CON MÁS DIVISIONES
// components/MapLayers/WMSLayerManager.tsx
// ACTUALIZAR TODAS LAS LEYENDAS CON LOS COLORES OFICIALES

const OPENWEATHER_LEGENDS: { [key: string]: TransformedLegend } = {
  precipitation: {
    layerId: "openweather_precipitation",
    serviceId: "openweather",
    layerType: "precipitation",
    title: "Precipitación (mm/h)",
    gradient: [
      { color: "#ffffff", value: "0" },
      { color: "#8cb4ff", value: "0.1" },
      { color: "#64e3ff", value: "0.3" },
      { color: "#48d648", value: "0.5" },
      { color: "#96e600", value: "0.8" },
      { color: "#ffea00", value: "1.0" },
      { color: "#ffb300", value: "1.5" },
      { color: "#ff7c00", value: "2.0" },
      { color: "#ff3200", value: "3.0" },
      { color: "#ff0000", value: "5.0" },
      { color: "#c80000", value: "7.0" },
      { color: "#a00000", value: "10.0" },
      { color: "#800000", value: "15.0" },
      { color: "#640000", value: "20.0" },
      { color: "#500000", value: "25.0" },
      { color: "#400000", value: "30.0" },
      { color: "#300000", value: "40.0" },
      { color: "#200000", value: "50+" },
    ],
    source: "OpenWeatherMap",
    description: "Precipitación en milímetros por hora",
  },
  
  clouds: {
    layerId: "openweather_clouds",
    serviceId: "openweather",
    layerType: "clouds",
    title: "Nubosidad (%)",
    gradient: [
      { color: "#ffffff", value: "0%" },
      { color: "#f5f5f5", value: "10%" },
      { color: "#ebebeb", value: "20%" },
      { color: "#e0e0e0", value: "30%" },
      { color: "#d6d6d6", value: "40%" },
      { color: "#c2c2c2", value: "50%" },
      { color: "#adadad", value: "60%" },
      { color: "#999999", value: "70%" },
      { color: "#858585", value: "80%" },
      { color: "#707070", value: "90%" },
      { color: "#5c5c5c", value: "100%" },
    ],
    source: "OpenWeatherMap",
    description: "Porcentaje de cobertura de nubes",
  },
  
  pressure: {
    layerId: "openweather_pressure",
    serviceId: "openweather",
    layerType: "pressure",
    title: "Presión Atmosférica (hPa)",
    gradient: [
      { color: "#750000", value: "970" },
      { color: "#a00000", value: "980" },
      { color: "#c80000", value: "990" },
      { color: "#e60000", value: "1000" },
      { color: "#ff1e00", value: "1010" },
      { color: "#ff7800", value: "1020" },
      { color: "#ffb400", value: "1030" },
      { color: "#fff000", value: "1040" },
      { color: "#ccff00", value: "1050" },
      { color: "#80ff00", value: "1060" },
      { color: "#00ff00", value: "1070" },
    ],
    source: "OpenWeatherMap",
    description: "Presión al nivel del mar",
  },
  
  wind: {
    layerId: "openweather_wind",
    serviceId: "openweather",
    layerType: "wind",
    title: "Velocidad del Viento (m/s)",
    gradient: [
      { color: "#ffffff", value: "0" },
      { color: "#e6e6e6", value: "1" },
      { color: "#cccccc", value: "2" },
      { color: "#b3b3b3", value: "3" },
      { color: "#999999", value: "4" },
      { color: "#8cb4ff", value: "5" },
      { color: "#64e3ff", value: "6" },
      { color: "#48d648", value: "7" },
      { color: "#96e600", value: "8" },
      { color: "#ffea00", value: "9" },
      { color: "#ffb300", value: "10" },
      { color: "#ff7c00", value: "12" },
      { color: "#ff3200", value: "14" },
      { color: "#ff0000", value: "16" },
      { color: "#c80000", value: "18" },
      { color: "#a00000", value: "20" },
      { color: "#800000", value: "25" },
      { color: "#640000", value: "30" },
      { color: "#500000", value: "35" },
      { color: "#400000", value: "40" },
      { color: "#300000", value: "45" },
      { color: "#200000", value: "50+" },
    ],
    source: "OpenWeatherMap",
    description: "Velocidad del viento a 10m sobre el suelo",
  },
  
  temp: {
    layerId: "openweather_temp",
    serviceId: "openweather",
    layerType: "temp",
    title: "Temperatura (°C)",
    gradient: [
      { color: "#8000ff", value: "-40" },
      { color: "#8000ff", value: "-30" },
      { color: "#8000ff", value: "-20" },
      { color: "#8000ff", value: "-10" },
      { color: "#8000ff", value: "0" },
      { color: "#0040ff", value: "5" },
      { color: "#0080ff", value: "10" },
      { color: "#00a0ff", value: "15" },
      { color: "#00c0ff", value: "20" },
      { color: "#00ff00", value: "25" },
      { color: "#40ff00", value: "30" },
      { color: "#80ff00", value: "35" },
      { color: "#ffff00", value: "40" },
      { color: "#ffc000", value: "45" },
      { color: "#ff8000", value: "50" },
      { color: "#ff4000", value: "55" },
      { color: "#ff0000", value: "60+" },
    ],
    source: "OpenWeatherMap",
    description: "Temperatura a 2m sobre el suelo",
  },
};

// Leyenda para RainViewer (también actualizada si es necesario)
const RAINVIEWER_LEGEND: TransformedLegend = {
  layerId: "rainviewer_precipitation",
  serviceId: "rainviewer",
  layerType: "precipitation",
  title: "Intensidad de Precipitación",
  gradient: [
    { color: "#8cb4ff", value: "Muy Ligera" },
    { color: "#64e3ff", value: "Ligera" },
    { color: "#48d648", value: "Moderada" },
    { color: "#96e600", value: "Fuerte" },
    { color: "#ffea00", value: "Muy Fuerte" },
    { color: "#ffb300", value: "Intensa" },
    { color: "#ff7c00", value: "Muy Intensa" },
    { color: "#ff3200", value: "Extrema" },
  ],
  source: "RainViewer",
  description: "Radar de precipitación en tiempo real",
};

export const WMSLayerManager: React.FC<WMSLayerManagerProps> = ({
  map,
  activeLayers,
  loading,
  infoMode,
  activeInfoLayer,
  onError,
  setFeatureInfo,
  setOpenDialog,
  setLayersLoading,
  onLegendUpdate,
}) => {
  const activeLayersRef = useRef<Map<string, L.Layer>>(new Map());
  const previousActiveLayersRef = useRef<Set<string>>(new Set());
  const [activeLegends, setActiveLegends] = useState<LegendInfo[]>([]);
  const initializedRef = useRef(false);

  // 🔥 FUNCIÓN PARA ACTUALIZAR LEYENDAS INMEDIATAMENTE
  const updateLegendsImmediately = useCallback(() => {
    console.log("🔥 Actualizando leyendas inmediatamente...");

    const legends: LegendInfo[] = activeLayers
      .filter((layer) => {
        const layerConfig = layer.layerConfig || layer;
        return layerConfig.isMeteoLayer === true;
      })
      .map((layer) => {
        const layerConfig = layer.layerConfig || layer;
        const layerType = getLayerTypeFromUrl(layerConfig.url);

        return {
          layerId: layer.layerId,
          serviceId: layerConfig.serviceId,
          layerType: layerType,
          isVisible: true,
        };
      });

    console.log("🔥 Leyendas generadas:", legends);
    setActiveLegends(legends);
    onLegendUpdate?.(legends);
  }, [activeLayers, onLegendUpdate]);

  // Efecto principal para manejar capas
  useEffect(() => {
    if (!map || loading) return;

    console.log("🗂️ Iniciando procesamiento de capas...", {
      activeLayers: activeLayers.map((l) => l.layerId),
      loading,
    });

    const processLayers = async () => {
      try {
        setLayersLoading(true);

        const currentLayerIds = new Set(
          activeLayers.map((layer) => layer.layerId)
        );

        console.log("🔄 Procesando capas. Actuales:", currentLayerIds);
        console.log("📊 Capas anteriores:", previousActiveLayersRef.current);

        // Remover capas que ya no están activas
        const layersToRemove: string[] = [];
        previousActiveLayersRef.current.forEach((layerId) => {
          if (!currentLayerIds.has(layerId)) {
            layersToRemove.push(layerId);
          }
        });

        console.log("🗑️ Capas a remover:", layersToRemove);

        for (const layerId of layersToRemove) {
          const layerToRemove = activeLayersRef.current.get(layerId);
          if (layerToRemove) {
            console.log(`🗑️ Removiendo capa: ${layerId}`);
            map.removeLayer(layerToRemove);
            activeLayersRef.current.delete(layerId);
          }
        }

        // Agregar nuevas capas
        const layersToAdd = activeLayers.filter(
          (layer) => !previousActiveLayersRef.current.has(layer.layerId)
        );

        console.log(
          "➕ Capas a agregar:",
          layersToAdd.map((l) => l.layerId)
        );

        for (const layer of layersToAdd) {
          console.log(`➕ Procesando capa: ${layer.layerId}`);
          await addLayerToMap(map, layer);
        }

        previousActiveLayersRef.current = currentLayerIds;
        console.log("✅ Procesamiento de capas completado");

        // 🔥 ACTUALIZAR LEYENDAS INMEDIATAMENTE DESPUÉS DE PROCESAR CAPAS
        updateLegendsImmediately();
      } catch (error) {
        console.error("❌ Error processing layers:", error);
        onError?.("Error cargando capas");
      } finally {
        setLayersLoading(false);
        console.log("🏁 Carga de capas finalizada");
      }
    };

    processLayers();
  }, [
    map,
    loading,
    activeLayers,
    onError,
    setLayersLoading,
    updateLegendsImmediately,
  ]);

  // Efecto para forzar actualización inicial de leyendas
  useEffect(() => {
    if (!initializedRef.current && activeLayers.length > 0) {
      console.log("🚀 Forzando inicialización de leyendas");
      updateLegendsImmediately();
      initializedRef.current = true;
    }
  }, [activeLayers, updateLegendsImmediately]);

  // Efecto adicional para detectar cambios en capas meteorológicas
  useEffect(() => {
    const hasMeteoLayers = activeLayers.some((layer) => {
      const layerConfig = layer.layerConfig || layer;
      return layerConfig.isMeteoLayer === true;
    });

    const hasMeteoLegends = activeLegends.length > 0;

    if (hasMeteoLayers && !hasMeteoLegends) {
      console.log(
        "⚠️  Detectadas capas meteo sin leyendas, forzando actualización"
      );
      updateLegendsImmediately();
    }
  }, [activeLayers, activeLegends.length, updateLegendsImmediately]);

  // Función para agregar capas al mapa
  const addLayerToMap = async (map: L.Map, layer: any): Promise<void> => {
    try {
      console.log("🔧 addLayerToMap - layer recibido:", layer);

      const layerConfig = layer.layerConfig || layer;

      if (!layerConfig) {
        throw new Error(`Layer ${layer.layerId} no tiene configuración`);
      }

      let newLayer: L.Layer;
      const isMeteoLayer = layerConfig.isMeteoLayer === true;

      if (isMeteoLayer) {
        newLayer = createMeteoTileLayer(layerConfig);
        map.addLayer(newLayer);
        activeLayersRef.current.set(layer.layerId, newLayer);

        console.log(`✅ Layer meteorológica agregada: ${layer.layerId}`);

        // 🔥 ACTUALIZAR LEYENDA INMEDIATAMENTE AL AGREGAR CAPA METEOROLÓGICA
        setTimeout(() => {
          updateLegendsImmediately();
        }, 50);
      } else {
        newLayer = await createWMSLayer(layerConfig);
        map.addLayer(newLayer);
        activeLayersRef.current.set(layer.layerId, newLayer);
        console.log("✅ WMS Layer creada exitosamente");
      }
    } catch (error) {
      console.error(`❌ Error adding layer ${layer.layerId}:`, error);
      throw error;
    }
  };

  // Crear capas meteorológicas
  const createMeteoTileLayer = (layerConfig: any): L.TileLayer => {
    const { url, opacity, zIndex, serviceId } = layerConfig;

    if (serviceId === "openweather") {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenWeatherMap API key no configurada");
      }

      const tileUrl = `https://tile.openweathermap.org/map/${getOpenWeatherLayerType(
        url
      )}/{z}/{x}/{y}.png?appid=${apiKey}`;

      return L.tileLayer(tileUrl, {
        attribution: "© OpenWeatherMap",
        opacity: opacity || 0.7,
        zIndex: zIndex || 300,
        maxZoom: layerConfig.zoommax || 19,
        minZoom: layerConfig.zoommin || 0,
        tileSize: 256,
        noWrap: true,
      });
    }

    if (serviceId === "rainviewer") {
      return L.tileLayer(url, {
        attribution: "© RainViewer",
        opacity: opacity || 0.8,
        zIndex: zIndex || 305,
        maxZoom: layerConfig.zoommax || 19,
        minZoom: layerConfig.zoommin || 0,
        tileSize: 256,
        noWrap: true,
      });
    }

    throw new Error(`Servicio meteorológico no soportado: ${serviceId}`);
  };

  // Helper functions
  const getOpenWeatherLayerType = (url: string): string => {
    const match = url.match(/map\/([a-z_]+)_new/);
    return match ? match[1] : "precipitation";
  };

  const getLayerTypeFromUrl = (url: string): string => {
    if (url.includes("precipitation")) return "precipitation";
    if (url.includes("clouds")) return "clouds";
    if (url.includes("pressure")) return "pressure";
    if (url.includes("wind")) return "wind";
    if (url.includes("temp")) return "temp";
    return "precipitation";
  };

  // Crear capas WMS tradicionales
  const createWMSLayer = async (layerConfig: any): Promise<L.TileLayer.WMS> => {
    if (!layerConfig.layers) {
      throw new Error(
        `Capa WMS ${layerConfig.layerId} no tiene propiedad 'layers'`
      );
    }

    let finalUrl = layerConfig.url;
    if (typeof window !== "undefined" && (window as any).applyProxyPrefix) {
      finalUrl = await (window as any).applyProxyPrefix(layerConfig.url);
    }

    return L.tileLayer.wms(finalUrl, {
      layers: layerConfig.layers,
      format: layerConfig.format || "image/png",
      transparent: layerConfig.transparent !== false,
      opacity: layerConfig.opacity || 0.8,
      version: layerConfig.version || "1.3.0",
      uppercase: layerConfig.uppercase !== false,
      zIndex: layerConfig.zIndex || 150,
    } as L.WMSOptions);
  };

  // Efecto para modo información WMS
  useEffect(() => {
    if (!map || !infoMode) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      try {
        const { lat, lng } = e.latlng;
        const bounds = map.getBounds();
        const size = map.getSize();

        if (!bounds || !size) {
          onError?.("No se pudo obtener la información del mapa");
          return;
        }

        const wmsLayers = activeLayers.filter((layer) => {
          const layerConfig = layer.layerConfig || layer;
          const isWMS =
            layerConfig && !layerConfig.isMeteoLayer && layerConfig.layers;
          return isWMS;
        });

        if (wmsLayers.length === 0) {
          onError?.("No hay capas WMS activas para consultar");
          return;
        }

        const featureInfoPromises = wmsLayers.map(async (layer) => {
          const layerConfig = layer.layerConfig || layer;

          try {
            const url = await buildGetFeatureInfoUrl(
              layerConfig,
              lat,
              lng,
              bounds,
              size
            );

            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.text();
            return {
              layerName: layer.name || layer.layerId,
              layerConfig: layerConfig,
              data: data,
              latlng: { lat, lng },
            };
          } catch (error) {
            console.error(
              `Error fetching feature info for layer ${layer.layerId}:`,
              error
            );
            return null;
          }
        });

        const results = await Promise.all(featureInfoPromises);
        const validResults = results.filter((result) => result !== null);

        if (validResults.length > 0) {
          setFeatureInfo(validResults);
          setOpenDialog(true);
        } else {
          onError?.("No se encontró información en la ubicación seleccionada");
        }
      } catch (error) {
        console.error("Error in map click handler:", error);
        onError?.("Error al obtener información de la capa");
      }
    };

    const buildGetFeatureInfoUrl = async (
      layerConfig: any,
      lat: number,
      lng: number,
      bounds: L.LatLngBounds,
      size: L.Point
    ): Promise<string> => {
      const { url, layers, version = "1.3.0" } = layerConfig;

      let baseUrl = url;
      if (typeof window !== "undefined" && (window as any).applyProxyPrefix) {
        baseUrl = await (window as any).applyProxyPrefix(url);
      }

      const params = new URLSearchParams({
        service: "WMS",
        version: version,
        request: "GetFeatureInfo",
        layers: layers,
        query_layers: layers,
        info_format: "text/html",
        feature_count: "50",
        x: Math.floor(size.x / 2).toString(),
        y: Math.floor(size.y / 2).toString(),
        width: size.x.toString(),
        height: size.y.toString(),
      });

      if (version === "1.3.0") {
        params.append("crs", "EPSG:4326");
        params.append("i", Math.floor(size.x / 2).toString());
        params.append("j", Math.floor(size.y / 2).toString());
        params.append(
          "bbox",
          `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`
        );
      } else {
        params.append("srs", "EPSG:4326");
        params.append("x", Math.floor(size.x / 2).toString());
        params.append("y", Math.floor(size.y / 2).toString());
        params.append(
          "bbox",
          `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
        );
      }

      return `${baseUrl}?${params.toString()}`;
    };

    const container = map.getContainer();
    container.style.cursor = "crosshair";

    if (infoMode) {
      map.on("click", handleMapClick);
    }

    return () => {
      map.off("click", handleMapClick);
      container.style.cursor = "";
    };
  }, [map, infoMode, activeLayers, onError, setFeatureInfo, setOpenDialog]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (map) {
        activeLayersRef.current.forEach((layer, layerId) => {
          map.removeLayer(layer);
        });
      }
      activeLayersRef.current.clear();
      setActiveLegends([]);
      onLegendUpdate?.([]);
    };
  }, [map, onLegendUpdate]);

  return null;
};

// Función para obtener configuraciones de leyenda
export const getMeteoLegendConfig = async (
  serviceId: string,
  layerType: string,
  layerId?: string
): Promise<TransformedLegend | null> => {
  try {
    let legendConfig: TransformedLegend | null = null;

    if (serviceId === "openweather") {
      legendConfig =
        OPENWEATHER_LEGENDS[layerType] || OPENWEATHER_LEGENDS.precipitation;
    } else if (serviceId === "rainviewer") {
      legendConfig = RAINVIEWER_LEGEND;
    }

    if (!legendConfig) {
      return getFallbackLegend(serviceId, layerType, layerId);
    }

    // Actualizar el layerId si se proporciona uno específico
    if (layerId) {
      return {
        ...legendConfig,
        layerId: layerId,
      };
    }

    return legendConfig;
  } catch (error) {
    console.error("Error obteniendo configuración de leyenda:", error);
    return getFallbackLegend(serviceId, layerType, layerId);
  }
};

// Leyenda de respaldo
const getFallbackLegend = (
  serviceId: string,
  layerType: string,
  layerId?: string
): TransformedLegend => {
  const serviceNames: { [key: string]: string } = {
    openweather: "OpenWeatherMap",
    rainviewer: "RainViewer",
  };

  const layerNames: { [key: string]: string } = {
    precipitation: "Precipitación",
    clouds: "Nubosidad",
    pressure: "Presión Atmosférica",
    wind: "Viento",
    temp: "Temperatura",
  };

  return {
    layerId: layerId || `${serviceId}_${layerType}`,
    serviceId,
    layerType,
    title: `${layerNames[layerType] || layerType} - ${
      serviceNames[serviceId] || serviceId
    }`,
    gradient: [
      { color: "#ffffff", value: "Muy Bajo" },
      { color: "#ffff80", value: "Bajo" },
      { color: "#ffff00", value: "Moderado" },
      { color: "#ff8000", value: "Alto" },
      { color: "#ff0000", value: "Muy Alto" },
      { color: "#800000", value: "Extremo" },
    ],
    description: "Datos meteorológicos",
    source: serviceNames[serviceId] || serviceId,
    isFallback: true,
  };
};

// Función helper para transformar múltiples leyendas
export const transformMeteoLegends = async (
  legends: LegendInfo[]
): Promise<TransformedLegend[]> => {
  if (!legends || legends.length === 0) {
    return [];
  }

  try {
    const legendPromises = legends.map(async (legend) => {
      return await getMeteoLegendConfig(
        legend.serviceId,
        legend.layerType,
        legend.layerId
      );
    });

    const results = await Promise.all(legendPromises);
    return results.filter(
      (legend): legend is TransformedLegend => legend !== null
    );
  } catch (error) {
    console.error("Error transformando leyendas:", error);
    return [];
  }
};

export default WMSLayerManager;
