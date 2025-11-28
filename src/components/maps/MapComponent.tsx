// components/MapComponent.tsx
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Components
import { ToolPalette } from "./MapControls/ToolPalette";
import { FeatureInfoDialog } from "./MapUtils/FeatureInfoDialog";
import { initializeMap } from "./MapUtils/MapInitializer";
import { WMSLayerManager, transformMeteoLegends, LegendInfo } from "./MapLayers/WMSLayerManager";
import { CombinedMeteoLegend, LegendItem } from "./MapLayers/CombinedMeteoLegend";

// Types and constants
import { ActivateLayerComponentProps } from "../../types/map-types";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "./MapUtils/constants";

import FilterIcon from "@mui/icons-material/Filter";

const MapComponent = ({
  activeLayers = [],
  isDrawerOpen,
  infoMode,
  activeInfoLayer,
  onError,
  onMapInit,
}: ActivateLayerComponentProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [featureInfo, setFeatureInfo] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [layersLoading, setLayersLoading] = useState(false);
  const [activeLegends, setActiveLegends] = useState<LegendInfo[]>([]);
  const [transformedLegends, setTransformedLegends] = useState<LegendItem[]>([]);
  const [showLegends, setShowLegends] = useState(true);
  const [legendsLoading, setLegendsLoading] = useState(false);
  const initializedRef = useRef(false);

  // Inicialización del mapa - UNA SOLA VEZ
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !mapContainerRef.current ||
      initializedRef.current
    )
      return;

    let cleanupFunction: () => void;

    const initMap = async () => {
      try {
        setLoading(true);
        initializedRef.current = true;

        const { map, cleanup } = await initializeMap({
          container: mapContainerRef.current!,
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          onInit: (map) => {
            mapRef.current = map;
            setLoading(false);
            onMapInit?.(map);
          },
        });
        cleanupFunction = cleanup;
      } catch (error) {
        console.error("Error initializing map:", error);
        setLoading(false);
        initializedRef.current = false;
        onError?.(
          error instanceof Error ? error.message : "Error initializing map"
        );
      }
    };

    initMap();

    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
      mapRef.current = null;
      initializedRef.current = false;
    };
  }, [onMapInit, onError]);

  // Efecto para redimensionar el mapa cuando se abre/cierra el drawer
  useEffect(() => {
    if (mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isDrawerOpen]);

  // Efecto para cambiar el cursor según el modo
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const container = mapContainerRef.current;
    if (infoMode) {
      container.style.cursor = "help";
    } else {
      container.style.cursor = "grab";
    }
    return () => {
      container.style.cursor = "";
    };
  }, [infoMode]);

  // 🔥 FUNCIÓN MEJORADA PARA MANEJAR ACTUALIZACIONES DE LEYENDAS
  const handleLegendUpdate = useCallback((legends: LegendInfo[]) => {
    console.log("🔄 handleLegendUpdate recibió:", legends);
    setActiveLegends(legends);
    
    // Mostrar automáticamente las leyendas cuando hay capas meteorológicas activas
    if (legends.length > 0) {
      setShowLegends(true);
    }
  }, []);

  // 🔥 EFECTO MEJORADO PARA TRANSFORMAR LEYENDAS
  useEffect(() => {
    const transformLegends = async () => {
      console.log("🔄 transformLegends iniciado con:", activeLegends);
      
      if (activeLegends.length === 0) {
        console.log("🔄 No hay leyendas activas, limpiando");
        setTransformedLegends([]);
        return;
      }

      try {
        setLegendsLoading(true);
        console.log("🔄 Transformando leyendas...");
        const transformed = await transformMeteoLegends(activeLegends);
        console.log("🔄 Leyendas transformadas:", transformed);
        setTransformedLegends(transformed);
      } catch (error) {
        console.error("❌ Error transformando leyendas:", error);
        setTransformedLegends([]);
      } finally {
        setLegendsLoading(false);
      }
    };

    transformLegends();
  }, [activeLegends]);

  // 🔥 FUNCIÓN PARA CERRAR LEYENDAS
  const handleCloseLegends = useCallback(() => {
    setShowLegends(false);
  }, []);

  // 🔥 FUNCIÓN PARA TOGGLE DE LEYENDAS
  const handleToggleLegends = useCallback((visible: boolean) => {
    setShowLegends(visible);
  }, []);

  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        position: "relative",
        p: 1,
      }}
    >
      {/* Contenedor del mapa */}
      <Box
        ref={mapContainerRef}
        id="map-container"
        sx={{
          height: "100%",
          width: "100%",
          borderRadius: "12px",
          border: "2px solid #e0e0e0",
          boxShadow: "0 8px 20px rgba(0, 0, 0, 0.12)",
          overflow: "hidden",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: "0 12px 24px rgba(0, 0, 0, 0.15)",
          },
          ...(infoMode
            ? {
                border: "2px solid #1976d2",
                boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.3)",
              }
            : {}),
        }}
      />
      {/* Controles del mapa */}
      {mapRef.current && (
        <>
          <ToolPalette map={mapRef.current} activeLayers={activeLayers} />
        </>
      )}
      {/* Loading para inicialización del mapa */}
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      {/* Loading para capas WMS */}
      {layersLoading && !loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: "50%",
            padding: "8px",
          }}
        >
          <CircularProgress size={32} />
        </Box>
      )}
      {/* 🔥 GESTOR DE CAPAS WMS Y METEOROLÓGICAS MEJORADO */}
      <WMSLayerManager
        map={mapRef.current}
        activeLayers={activeLayers}
        loading={loading}
        infoMode={Boolean(infoMode)}
        activeInfoLayer={activeInfoLayer}
        onError={onError}
        setFeatureInfo={setFeatureInfo}
        setOpenDialog={setOpenDialog}
        setLayersLoading={setLayersLoading}
        onLegendUpdate={handleLegendUpdate}
      />
      {/* 🔥 LEYENDAS METEOROLÓGICAS COMBINADAS MEJORADAS */}
      <CombinedMeteoLegend
        legends={transformedLegends}
        onClose={handleCloseLegends}
        onToggle={handleToggleLegends}
        isVisible={showLegends && transformedLegends.length > 0}
      />
      {/* Diálogo de información de features */}
      <FeatureInfoDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        featureInfo={featureInfo}
      />
      {/* Indicador de capas meteorológicas activas */}
      {activeLegends.length > 0 && (
        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            gap: 1,
            backdropFilter: "blur(10px)",
            minWidth: "200px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#1976d2",
              animation: "pulse 2s infinite",
              flexShrink: 0,
            }}
          />
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <Box
              component="span"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "text.primary",
                lineHeight: 1.2,
              }}
            >
              {activeLegends.length} capa(s) meteorológica(s)
            </Box>
            {legendsLoading && (
              <Box
                component="span"
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  fontStyle: "italic",
                }}
              >
                Cargando leyendas...
              </Box>
            )}
            {!showLegends && transformedLegends.length > 0 && (
              <Box
                component="span"
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                }}
              >
                Leyendas ocultas - Click en ⚡ para mostrar
              </Box>
            )}
          </Box>
        </Box>
      )}
      {/* Información del modo actual */}
      {infoMode && (
        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            backgroundColor: "rgba(25, 118, 210, 0.9)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: 500,
            backdropFilter: "blur(10px)",
          }}
        >
          Modo información - Haz clic en el mapa para obtener datos
        </Box>
      )}

      <style jsx global>{`
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
          }
        }

        /* Estilos para pantalla completa */
        .leaflet-container:-webkit-full-screen {
          width: 100% !important;
          height: 100% !important;
        }

        .leaflet-container:-ms-fullscreen {
          width: 100% !important;
          height: 100% !important;
        }

        .leaflet-container:fullscreen {
          width: 100% !important;
          height: 100% !important;
        }

        /* 🔥 ESTILOS GLOBALES PARA LA LEYENDA - MÁS FUERTES */
        #portal-root {
          z-index: 10000 !important;
        }

        #portal-root * {
          pointer-events: auto !important;
        }

        /* 🔥 ASEGURAR QUE LOS ELEMENTOS EN FULLSCREEN SEAN VISIBLES */
        .leaflet-container:-webkit-full-screen ~ #portal-root {
          display: block !important;
          visibility: visible !important;
        }

        .leaflet-container:fullscreen ~ #portal-root {
          display: block !important;
          visibility: visible !important;
        }
      `}</style>
    </Box>
  );
};

export default MapComponent;