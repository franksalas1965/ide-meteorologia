"use client";
import React from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  IconButton,
  Fade,
  Chip,
  Stack,
} from "@mui/material";
import { DynamicComponentType } from "@/types/types";
import CloseIcon from "@mui/icons-material/Close";
import { WMSLayer } from "@/types/map-types";
import * as L from "leaflet";

interface DynamicAreaProps {
  currentView: {
    component: DynamicComponentType;
    props?: any;
  } | null;
  activeLayers: WMSLayer[];
  isDrawerOpen: boolean;
  children?: React.ReactNode;
  selectedOption?: any;
  onClose?: () => void;
  isOpen?: boolean;
  infoMode: boolean;
  activeInfoLayer?: WMSLayer | null;
  onLayerToggle?: (layerId: string, isActive: boolean) => void;
  onImageToggle?: (imageId: string, isActive: boolean) => void;
  onMapInit?: (map: L.Map) => void;
  onToggleInfoMode: (mode: boolean) => void;
}

const MapComponent = dynamic(() => import("./maps/MapComponent"), {
  ssr: false,
  loading: () => <LoadingMessage message="Cargando componente de mapa..." />,
});

const dynamicComponents = {
  MapsViewer: MapComponent,
  SentinelViewer: dynamic(() => import("./Viewers/SentinelViewer"), {
    ssr: false,
    loading: () => (
      <LoadingMessage message="Cargando imágenes satelitales..." />
    ),
  }),
  ReportsViewer: dynamic(() => import("./Viewers/ReportsViewer"), {
    ssr: false,
    loading: () => <LoadingMessage message="Generando reportes..." />,
  }),
  ChartsViewer: dynamic(() => import("./Viewers/ChartsViewer"), {
    ssr: false,
    loading: () => <LoadingMessage message="Cargando gráficos..." />,
  }),
  PopulationChart: dynamic(() => import("./Charts/PopulationChart"), {
    ssr: false,
    loading: () => <LoadingMessage message="Cargando datos de población..." />,
  }),
};

const LoadingMessage = ({ message }: { message: string }) => (
  <Box p={3}>
    <Typography variant="body1">{message}</Typography>
    <Typography variant="caption" color="text.secondary">
      Por favor espere...
    </Typography>
  </Box>
);

const DynamicArea: React.FC<DynamicAreaProps> = ({
  currentView,
  activeLayers = [],
  isDrawerOpen,
  children,
  onClose,
  isOpen = true,
  infoMode,
  activeInfoLayer,
  onLayerToggle,
  onImageToggle,
  onMapInit,
  onToggleInfoMode,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClose = () => {
    // Desactivar todas las capas activas
    activeLayers.forEach((layer) => {
      if (onLayerToggle) {
        onLayerToggle(layer.layerId, false);
      }
    });

    // Si es una vista de imágenes, desactivarla también
    if (
      currentView?.component === "loadImageSentinel" &&
      currentView.props?.imageId &&
      onImageToggle
    ) {
      onImageToggle(currentView.props.imageId, false);
    }

    if (onClose) {
      onClose();
    }
  };

  const dynamicAreaStyles = {
    position: "fixed",
    top: isMobile ? 64 : 120,
    left: {
      xs: "8px",
      sm: isDrawerOpen ? "calc(320px + 16px)" : "20px",
    },
    right: {
      xs: "8px",
      sm: isDrawerOpen ? "16px" : "20px",
    },
    bottom: isMobile ? "8px" : 10,
    width: {
      xs: "calc(100% - 16px)",
      sm: isDrawerOpen ? "calc(100% - 320px - 32px)" : "calc(100% - 40px)",
    },
    height: isMobile ? "calc(100% - 64px - 8px)" : "calc(100vh - 120px - 12px)",
    backgroundColor: "#95EC7AFF",
    zIndex: theme.zIndex.drawer - 1,
    transition: theme.transitions.create(
      ["left", "width", "right", "opacity"],
      {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }
    ),
    p: currentView ? 2 : 0,
    borderRadius: "12px",
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    ...(isMobile &&
      isDrawerOpen && {
        "&::before": {
          content: '""',
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          zIndex: theme.zIndex.drawer - 2,
        },
      }),
  };

  const renderEmptyState = () => (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "text.secondary",
        p: 3,
      }}
    >
      <Box
        component="img"
        src="/select-option.svg"
        alt="Seleccione una opción"
        sx={{ width: 150, mb: 2 }}
      />
      <Typography variant="body1">Seleccione una opción del menú</Typography>
    </Box>
  );

  const renderCurrentView = () => {
    if (!currentView) return renderEmptyState();

    return (
      <>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          {onClose && (
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                position: "absolute",
                top: 0,
                right: 0,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.action.hover,
                "&:hover": {
                  backgroundColor: theme.palette.action.selected,
                },
                width: 24,
                height: 24,
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Vista principal */}
        {currentView.component === "activateLayer" && (
          <dynamicComponents.MapsViewer
            activeLayers={activeLayers}
            isDrawerOpen={isDrawerOpen}
            onLayerToggle={onLayerToggle}
            onMapInit={onMapInit}
            infoMode={infoMode}
            activeInfoLayer={activeInfoLayer}
          />
        )}

        {currentView.component === "loadImageSentinel" && (
          <dynamicComponents.SentinelViewer />
        )}
        {currentView.component === "reports" && (
          <dynamicComponents.ReportsViewer />
        )}
        {currentView.component === "charts" &&
          (currentView.props?.chartType === "population" ? (
            <dynamicComponents.PopulationChart data={currentView.props?.data} />
          ) : (
            <dynamicComponents.ChartsViewer
              chartType={currentView.props?.chartType}
            />
          ))}

        {children && (
          <Box sx={{ mt: 4, borderTop: "1px solid #ddd", pt: 3 }}>
            {children}
          </Box>
        )}
      </>
    );
  };

  return (
    <Fade in={isOpen} timeout={300}>
      <Box sx={{ ...dynamicAreaStyles, display: isOpen ? "flex" : "none" }}>
        {renderCurrentView()}
      </Box>
    </Fade>
  );
};

export default DynamicArea;
