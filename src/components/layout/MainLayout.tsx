// components/DashboardLayout.tsx
"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Box, CircularProgress, Snackbar, Alert } from "@mui/material";
import Sidebar from "../../components/layout/Sidebar";
import useMenu from "../../hooks/useMenu";
import Header from "./Header";
import DynamicArea from "../DynamicArea";
import { DashboardAction, DynamicComponentType } from "../../types/types";
import { MenuAction, MenuGroup } from "../../types/menu";
import { WMSLayer, LayerState } from "@/types/map-types";
import { getWMSLayerBounds } from "@/utils/wmsUtils";
import { getRuntimeConfig } from "@/utils/runtimeConfig";

// Types
type LoadingState = {
  isLoading: boolean;
  message: string;
};

type CurrentView = {
  component: DynamicComponentType;
  props?: any;
} | null;

type DashboardLayoutProps = {
  children: React.ReactNode;
};

/**
 * Custom hook para manejar el estado de las capas
 */
const useLayerManagement = () => {
  const [layerState, setLayerState] = useState<LayerState>({});

  const activeLayers = useMemo(() => {
    return Object.entries(layerState)
      .filter(([_, { isActive }]) => isActive)
      .map(([_, { config }]) => config)
      .filter(Boolean) as WMSLayer[];
  }, [layerState]);

  const handleLayerToggle = useCallback(
    (layerId: string, isActive?: boolean) => {
      setLayerState((prev) => ({
        ...prev,
        [layerId]: {
          ...prev[layerId],
          isActive:
            isActive !== undefined ? isActive : !prev[layerId]?.isActive,
        },
      }));
    },
    []
  );

  const updateLayerState = useCallback((layers: WMSLayer | WMSLayer[]) => {
    setLayerState((prev) => {
      const newState = { ...prev };
      const layersArray = Array.isArray(layers) ? layers : [layers];

      layersArray.forEach((layer) => {
        newState[layer.layerId] = {
          isActive: prev[layer.layerId]?.isActive ?? true,
          config: layer,
        };
      });

      return newState;
    });
  }, []);

  return {
    layerState,
    activeLayers,
    handleLayerToggle,
    updateLayerState,
    setLayerState,
  };
};

// Función para fetch con timeout mejorado
const useFetchWithTimeout = () => {
  return useCallback(
    async (
      url: string,
      options: RequestInit = {},
      timeout = 10000
    ): Promise<Response> => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    },
    []
  );
};

/**
 * Componente principal del dashboard que maneja el layout con sidebar y área dinámica
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  // Estado del menú
  const { menuGroups, loading, error } = useMenu();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [infoMode, setInfoMode] = useState(false);
  const [activeInfoLayer, setActiveInfoLayer] = useState<WMSLayer | null>(null);

  // Estado de capas
  const { layerState, activeLayers, handleLayerToggle, updateLayerState } =
    useLayerManagement();

  // Estado del mapa - inicializado con un mapa básico
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [baseLayers, setBaseLayers] = useState<any[]>([]);

  // Estado de carga
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: "",
  });

  // Estado de errores
  const [errorState, setErrorState] = useState<string | null>(null);

  // Estado del área dinámica
  const [currentView, setCurrentView] = useState<CurrentView>(null);
  const [isDynamicAreaOpen, setIsDynamicAreaOpen] = useState(false);

  const fetchWithTimeout = useFetchWithTimeout();

  // Cargar configuración de capas base usando el nuevo sistema
  useEffect(() => {
    const loadBaseLayersConfig = async () => {
      try {
        setLoadingState({
          isLoading: true,
          message: "Cargando configuración del mapa...",
        });

        const config = getRuntimeConfig();

        // Usar la URL de baseLayers desde la configuración dinámica
        const baseLayersUrl = config.baseLayersUrl;
        const timestamp = new Date().getTime();
        const urlWithCacheBuster = `${baseLayersUrl}?v=${timestamp}`;

        console.log("Cargando capas base desde:", urlWithCacheBuster);

        const response = await fetchWithTimeout(urlWithCacheBuster, {}, 15000);

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar la configuración de capas base: ${response.status}`
          );
        }

        const layers = await response.json();
        setBaseLayers(layers);

        setLoadingState({ isLoading: false, message: "" });
      } catch (err) {
        console.error("Error al cargar capas base:", err);

        const errorMessage =
          err instanceof Error
            ? err.name === "AbortError"
              ? "Timeout: La configuración de capas base tardó demasiado en cargar"
              : err.message
            : "Error desconocido al cargar capas base";

        setErrorState(errorMessage);
        setLoadingState({ isLoading: false, message: "" });

        // Fallback para desarrollo
        if (process.env.NODE_ENV === "development") {
          try {
            console.log("Intentando carga de fallback para capas base...");
            const fallbackResponse = await fetch("/baseLayers.json");
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              setBaseLayers(fallbackData);
              console.log("Capas base cargadas desde fallback");
            }
          } catch (fallbackError) {
            console.error(
              "Fallback de capas base también falló:",
              fallbackError
            );
          }
        }
      }
    };

    loadBaseLayersConfig();
  }, [fetchWithTimeout]);

  // Inicializar mapa
  useEffect(() => {
    let map: L.Map | null = null;

    const initMap = async () => {
      if (
        typeof window !== "undefined" &&
        !mapInstance &&
        baseLayers.length > 0 &&
        !document.getElementById("map")?._leaflet_map
      ) {
        const L = await import("leaflet");

        // Verifica si ya existe un mapa en el contenedor
        const container = document.getElementById("map");
        if (container && (container as any)._leaflet_map) {
          return; // Ya hay un mapa, no inicializar otro
        }

        const config = getRuntimeConfig();

        map = L.map("map", {
          center: config.defaultCenter || [22.977093065, -82.1705474125],
          zoom: config.defaultZoom || 6,
        });

        const defaultBaseLayer = baseLayers[0];
        if (defaultBaseLayer) {
          L.tileLayer(defaultBaseLayer.url, {
            attribution: defaultBaseLayer.attribution,
          }).addTo(map);
        }

        setMapInstance(map);
      }
    };

    initMap();

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [baseLayers, mapInstance]);

  // Función para asegurar que tenemos una instancia de mapa
  const ensureMapInstance = useCallback(async () => {
    if (!mapInstance) {
      setLoadingState({
        isLoading: true,
        message: "Inicializando mapa...",
      });

      const L = await import("leaflet");
      const config = getRuntimeConfig();

      const newMap = L.map("map", {
        center: config.defaultCenter || [22.977093065, -82.1705474125],
        zoom: config.defaultZoom || 6,
      });

      if (baseLayers.length > 0) {
        const defaultBaseLayer = baseLayers[0];
        L.tileLayer(defaultBaseLayer.url, {
          attribution: defaultBaseLayer.attribution,
        }).addTo(newMap);
      }

      setMapInstance(newMap);
      setLoadingState({ isLoading: false, message: "" });
      return newMap;
    }
    return mapInstance;
  }, [mapInstance, baseLayers]);

  // Cambiar la función handleToggleInfoMode
  const handleToggleInfoMode = useCallback(
    async (mode: boolean, layer?: WMSLayer) => {
      try {
        const L = await import("leaflet");
        const map = await ensureMapInstance();

        setInfoMode(mode);
        setActiveInfoLayer(mode ? layer || null : null);

        const container = map.getContainer();
        if (mode) {
          // Modo INFO activado: cursor "help" y deshabilitar arrastre
          map.dragging.disable();
          container.style.cursor = "help";
        } else {
          // Modo INFO desactivado: RESTAURAR "grab" y funcionalidad
          map.dragging.enable();
          container.style.cursor = "grab";
        }
      } catch (err) {
        console.error("Error al cambiar modo info:", err);
        setErrorState("Error al configurar el modo de información");
      }
    },
    [ensureMapInstance]
  );

  /**
   * Cierra el área dinámica
   */
  const handleCloseDynamicArea = useCallback(() => {
    setIsDynamicAreaOpen(false);
    setCurrentView(null);
  }, []);

  /**
   * Maneja el zoom a una capa WMS
   */
  const handleZoomToWMSLayer = useCallback(
    async (wmsUrl: string, layerName: string) => {
      try {
        const L = await import("leaflet");
        const map = await ensureMapInstance();

        setLoadingState({
          isLoading: true,
          message: "Calculando extensión de la capa...",
        });

        const wmsBounds = await getWMSLayerBounds(wmsUrl, layerName, (msg) => {
          setLoadingState((prev) => ({ ...prev, message: msg }));
        });

        // Conversión directa aquí
        const leafletBounds: L.LatLngBoundsExpression = [
          [wmsBounds.south, wmsBounds.west],
          [wmsBounds.north, wmsBounds.east],
        ];

        setLoadingState((prev) => ({
          ...prev,
          message: "Ajustando vista del mapa...",
        }));

        map.fitBounds(leafletBounds);
      } catch (error) {
        console.error("Error al calcular bounds:", error);
        setErrorState("Error al calcular la extensión de la capa");
      } finally {
        setLoadingState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [ensureMapInstance]
  );

  /**
   * Maneja acciones del dashboard
   */
  const handleActionClick = useCallback(
    async (action: DashboardAction) => {
      try {
        // Asegurarnos de que tenemos una instancia de mapa
        await ensureMapInstance();

        switch (action.actionType) {
          case "toggleInfoMode":
            const layerConfig = action.layerConfig || action.payload?.layer;
            handleToggleInfoMode(!infoMode, layerConfig);
            break;
          case "activateLayer":
            const layersToActivate =
              action.layerConfig || action.payload?.layers;
            if (!layersToActivate) {
              setErrorState("Configuración de capa no proporcionada");
              return;
            }

            setCurrentView({
              component: "activateLayer",
              props: { layers: layersToActivate },
            });
            setIsDynamicAreaOpen(true);

            updateLayerState(layersToActivate);
            break;

          case "loadImageSentinel":
          case "loadImage":
            if (!action.imageId) {
              setErrorState("ID de imagen no proporcionado");
              return;
            }
            setCurrentView({
              component: "loadImageSentinel",
              props: { imageId: action.imageId },
            });
            setIsDynamicAreaOpen(true);
            break;

          case "showChart":
            setCurrentView({
              component: "charts",
              props: { chartType: action.payload?.chartType },
            });
            setIsDynamicAreaOpen(true);
            break;

          case "showReports":
            setCurrentView({
              component: "reports",
              props: { chartType: action.payload?.chartType },
            });
            setIsDynamicAreaOpen(true);
            break;

          default:
            setCurrentView(null);
            setIsDynamicAreaOpen(false);
        }
      } catch (error) {
        console.error("Error handling action:", error);
        setErrorState("Error al procesar la acción");
      }
    },
    [updateLayerState, handleToggleInfoMode, infoMode, ensureMapInstance]
  );

  /**
   * Maneja acciones del menú
   */
  const handleMenuAction = useCallback(
    async (actionType: string, action: MenuAction) => {
      try {
        if (!action.action) {
          setErrorState("Acción del menú no definida");
          return;
        }

        const map = await ensureMapInstance();

        if (actionType === "zoomToLayer" && action.layerConfig) {
          if (action.layerConfig.bounds) {
            // Caso con bounds directos
            setLoadingState({ isLoading: true, message: "Ajustando vista..." });
            map.fitBounds(action.layerConfig.bounds);
            setLoadingState((prev) => ({ ...prev, isLoading: false }));
          } else if (action.layerConfig.url && action.layerConfig.layers) {
            // Caso WMS
            setLoadingState({ isLoading: true, message: "Ajustando vista..." });
            await handleZoomToWMSLayer(
              action.layerConfig.url,
              action.layerConfig.layers
            );
            setLoadingState((prev) => ({ ...prev, isLoading: false }));
          }
          return;
        }

        const dashboardAction: DashboardAction = {
          actionType: actionType as DashboardAction["actionType"],
          payload: action.payload,
          ...(action.layerConfig && {
            layerConfig: action.layerConfig,
            layers: [action.layerConfig],
          }),
          ...(action.imageId && { imageId: action.imageId }),
          ...(action.chartType && { chartType: action.chartType }),
        };

        await handleActionClick(dashboardAction);
      } catch (error) {
        console.error("Error en acción de menú:", error);
        setErrorState("Error al procesar la acción del menú");
      }
    },
    [handleActionClick, handleZoomToWMSLayer, ensureMapInstance]
  );

  /**
   * Alterna el estado del drawer móvil
   */
  const handleDrawerToggle = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  /**
   * Maneja el cierre de notificaciones de error
   */
  const handleCloseError = useCallback(() => {
    setErrorState(null);
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* Elemento contenedor del mapa (oculto) */}
      <div id="map" style={{ display: "none" }}></div>

      {/* Overlay de carga */}
      {loadingState.isLoading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.7)",
            zIndex: 9999,
          }}
        >
          <CircularProgress color="secondary" size={60} />
          <Box
            sx={{
              color: "white",
              mt: 2,
              textAlign: "center",
              maxWidth: "80%",
              padding: "0 20px",
            }}
          >
            {loadingState.message}
          </Box>
        </Box>
      )}

      {/* Notificación de errores */}
      <Snackbar
        open={!!errorState}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {errorState}
        </Alert>
      </Snackbar>

      <Header onMenuToggle={handleDrawerToggle} />

      {/* Área dinámica */}
      {currentView && (
        <DynamicArea
          currentView={currentView}
          activeLayers={activeLayers}
          isDrawerOpen={mobileOpen}
          isOpen={isDynamicAreaOpen}
          onClose={handleCloseDynamicArea}
          onLayerToggle={handleLayerToggle}
          onMapInit={setMapInstance}
          infoMode={infoMode}
          activeInfoLayer={activeInfoLayer}
          onToggleInfoMode={handleToggleInfoMode}
        />
      )}

      {/* Contenido principal */}
      <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden" }}>
        <Sidebar
          menuGroups={menuGroups}
          loading={loading}
          error={error}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          layerState={layerState}
          onLayerToggle={handleLayerToggle}
          onActionClick={handleMenuAction}
          onImageToggle={() => {}}
        />

        <Box component="main" sx={{ flexGrow: 1, overflow: "hidden" }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
