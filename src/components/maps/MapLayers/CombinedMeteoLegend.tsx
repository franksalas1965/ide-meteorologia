// components/MapLayers/CombinedMeteoLegend.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Collapse,
  useTheme,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FilterIcon from "@mui/icons-material/Filter";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Portal } from "../MapLayers/Portal"; // Ajusta la ruta según tu estructura

export interface LegendItem {
  layerId: string;
  serviceId: string;
  layerType: string;
  title: string;
  gradient: Array<{ color: string; value: string }>;
  description?: string;
  source?: string;
  isFallback?: boolean;
}

interface CombinedMeteoLegendProps {
  legends: LegendItem[];
  onClose: () => void;
  onToggle: (visible: boolean) => void;
  isVisible: boolean;
}

export const CombinedMeteoLegend: React.FC<CombinedMeteoLegendProps> = ({
  legends,
  onClose,
  onToggle,
  isVisible,
}) => {
  const theme = useTheme();
  const [expandedTables, setExpandedTables] = useState<{
    [key: string]: boolean;
  }>({});
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 🔥 DETECTAR MODO FULLSCREEN MEJORADO
  useEffect(() => {
    const checkFullscreen = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      console.log("🖥️ Fullscreen detectado:", !!fullscreenElement);
      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener("fullscreenchange", checkFullscreen);
    document.addEventListener("webkitfullscreenchange", checkFullscreen);
    document.addEventListener("mozfullscreenchange", checkFullscreen);
    document.addEventListener("MSFullscreenChange", checkFullscreen);

    checkFullscreen();

    return () => {
      document.removeEventListener("fullscreenchange", checkFullscreen);
      document.removeEventListener("webkitfullscreenchange", checkFullscreen);
      document.removeEventListener("mozfullscreenchange", checkFullscreen);
      document.removeEventListener("MSFullscreenChange", checkFullscreen);
    };
  }, []);

  if (legends.length === 0) {
    return null;
  }

  const getGradientString = (
    gradient: Array<{ color: string; value: string }>
  ) => {
    return `linear-gradient(to right, ${gradient
      .map((item) => item.color)
      .join(", ")})`;
  };

  const getIntermediateLabels = (
    gradient: Array<{ color: string; value: string }>
  ) => {
    if (gradient.length <= 5) {
      return gradient;
    }

    const step = Math.floor(gradient.length / 4);
    const intermediatePoints = [
      gradient[0],
      ...Array.from({ length: 3 }, (_, i) => {
        const index = Math.min((i + 1) * step, gradient.length - 2);
        return gradient[index];
      }),
      gradient[gradient.length - 1],
    ];

    return intermediatePoints;
  };

  const toggleTableExpansion = (layerId: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  // 🔥 CONTENIDO DE LA LEYENDA
  const LegendContent = (
    <>
      {/* 🔥 BOTÓN DE TOGGLE */}
      <Box
        sx={{
          position: isFullscreen ? "fixed" : "absolute",
          top: isFullscreen ? "20px" : "80px",
          left: isFullscreen ? "20px" : "16px",
          zIndex: isFullscreen ? 10000 : 1000,
          pointerEvents: "auto",
        }}
      >
        <IconButton
          onClick={() => onToggle(!isVisible)}
          sx={{
            backgroundColor: isFullscreen
              ? "rgba(255, 255, 255, 0.98)"
              : "rgba(255, 255, 255, 0.95)",
            border: isFullscreen
              ? `2px solid ${theme.palette.primary.main}`
              : "1px solid #e0e0e0",
            backdropFilter: "blur(10px)",
            width: "48px",
            height: "48px",
            boxShadow: isFullscreen
              ? "0 4px 20px rgba(0, 0, 0, 0.3)"
              : "0 2px 8px rgba(0, 0, 0, 0.15)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              boxShadow: "0 6px 25px rgba(0, 0, 0, 0.4)",
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s ease",
          }}
        >
          <FilterIcon
            color={isVisible ? "primary" : "action"}
            fontSize="medium"
          />
        </IconButton>
      </Box>

      {/* 🔥 PANEL DE LEYENDAS */}
      <Collapse in={isVisible} timeout="auto" orientation="horizontal">
        <Paper
          elevation={isFullscreen ? 8 : 4}
          sx={{
            position: isFullscreen ? "fixed" : "absolute",
            top: isFullscreen ? "80px" : "140px",
            left: isFullscreen ? "20px" : "16px",
            zIndex: isFullscreen ? 9999 : 1000,
            padding: theme.spacing(2),
            backgroundColor: isFullscreen
              ? "rgba(255, 255, 255, 0.98)"
              : "rgba(255, 255, 255, 0.97)",
            backdropFilter: "blur(20px)",
            minWidth: "320px",
            maxWidth: "350px",
            border: isFullscreen
              ? `2px solid ${theme.palette.primary.main}`
              : `1px solid ${theme.palette.divider}`,
            borderRadius: "12px",
            maxHeight: isFullscreen
              ? "calc(100vh - 100px)"
              : "calc(100vh - 180px)",
            display: "flex",
            flexDirection: "column",
            boxShadow: isFullscreen
              ? "0 8px 32px rgba(0, 0, 0, 0.3)"
              : "0 4px 20px rgba(0, 0, 0, 0.15)",
            pointerEvents: "auto",
          }}
        >
          {/* Header del panel */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              pb: 1,
              borderBottom: `1px solid ${theme.palette.divider}`,
              flexShrink: 0,
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              color="primary"
              sx={{
                fontSize: isFullscreen ? "1.1rem" : "1rem",
              }}
            >
              Leyendas Meteorológicas
              {isFullscreen && (
                <Typography
                  component="span"
                  variant="caption"
                  sx={{
                    ml: 1,
                    color: "text.secondary",
                    fontStyle: "italic",
                  }}
                >
                  (Pantalla completa)
                </Typography>
              )}
            </Typography>
            <IconButton
              size="small"
              onClick={onClose}
              sx={{
                color: theme.palette.text.secondary,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* 🔥 CONTENEDOR CON SCROLL INTERNO */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              overflowY: "auto",
              overflowX: "hidden",
              flex: 1,
              pr: 0.5,
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: theme.palette.action.hover,
                borderRadius: "3px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: theme.palette.action.disabled,
                borderRadius: "3px",
                "&:hover": {
                  background: theme.palette.action.active,
                },
              },
            }}
          >
            {legends.map((legend, index) => (
              <Box
                key={legend.layerId}
                sx={{
                  padding: theme.spacing(1.5),
                  borderRadius: "8px",
                  backgroundColor: theme.palette.background.default,
                  border: `1px solid ${theme.palette.divider}`,
                  flexShrink: 0,
                  ...(isFullscreen && {
                    backgroundColor: theme.palette.background.paper,
                    border: `2px solid ${theme.palette.divider}`,
                  }),
                }}
              >
                {/* Título de la leyenda */}
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  gutterBottom
                  sx={{
                    color: theme.palette.text.primary,
                    fontSize: isFullscreen ? "0.95rem" : "0.9rem",
                    lineHeight: 1.2,
                  }}
                >
                  {legend.title}
                </Typography>

                {/* 🔥 GRADIENTE VISUAL CONTINUO */}
                <Box sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      height: "24px",
                      background: getGradientString(legend.gradient),
                      borderRadius: "6px",
                      border: "1px solid #ccc",
                      marginBottom: "8px",
                      width: "100%",
                      ...(isFullscreen && {
                        height: "26px",
                        border: "2px solid #ccc",
                      }),
                    }}
                  />

                  {/* 🔥 ETIQUETAS ESTRATÉGICAS DEL GRADIENTE */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      flexWrap: "wrap",
                      gap: 0.5,
                    }}
                  >
                    {getIntermediateLabels(legend.gradient).map(
                      (point, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            flex:
                              idx === 0 ||
                              idx ===
                                getIntermediateLabels(legend.gradient).length -
                                  1
                                ? "0 0 auto"
                                : "1",
                            minWidth: "45px",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: "medium",
                              color: theme.palette.text.secondary,
                              fontSize: isFullscreen ? "0.75rem" : "0.7rem",
                              textAlign: "center",
                              lineHeight: 1.2,
                            }}
                          >
                            {point.value}
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                </Box>

                {/* 🔥 BOTÓN PARA EXPANDIR/COLAPSAR TABLA DE VALORES */}
                {legend.gradient.length > 8 && (
                  <Box sx={{ mb: 1 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={() => toggleTableExpansion(legend.layerId)}
                      endIcon={
                        expandedTables[legend.layerId] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )
                      }
                      sx={{
                        textTransform: "none",
                        fontSize: isFullscreen ? "0.8rem" : "0.75rem",
                        padding: "4px 8px",
                        minHeight: "28px",
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.secondary,
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: theme.palette.action.hover,
                        },
                        ...(isFullscreen && {
                          borderWidth: "2px",
                        }),
                      }}
                    >
                      {expandedTables[legend.layerId] ? "Ocultar" : "Mostrar"}{" "}
                      valores ({legend.gradient.length})
                    </Button>
                  </Box>
                )}

                {/* 🔥 TABLA DE VALORES DETALLADA (PLEGABLE) */}
                {legend.gradient.length > 8 && (
                  <Collapse in={expandedTables[legend.layerId]} timeout="auto">
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        backgroundColor: theme.palette.background.paper,
                        borderRadius: "6px",
                        border: `1px solid ${theme.palette.divider}`,
                        maxHeight: "180px",
                        overflowY: "auto",
                        "&::-webkit-scrollbar": {
                          width: "4px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: theme.palette.action.hover,
                          borderRadius: "2px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          background: theme.palette.action.disabled,
                          borderRadius: "2px",
                        },
                        ...(isFullscreen && {
                          border: `2px solid ${theme.palette.divider}`,
                          maxHeight: "200px",
                        }),
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight="bold"
                        sx={{
                          display: "block",
                          mb: 1,
                          color: theme.palette.text.primary,
                          fontSize: isFullscreen ? "0.8rem" : "0.75rem",
                        }}
                      >
                        Valores de referencia:
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(85px, 1fr))",
                          gap: 0.5,
                        }}
                      >
                        {legend.gradient.map((item, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                              padding: "3px 5px",
                              borderRadius: "3px",
                              backgroundColor:
                                idx % 2 === 0
                                  ? theme.palette.action.hover
                                  : "transparent",
                              transition: "all 0.2s ease",
                              "&:hover": {
                                backgroundColor: theme.palette.action.selected,
                              },
                              ...(isFullscreen && {
                                padding: "4px 6px",
                              }),
                            }}
                          >
                            <Box
                              sx={{
                                width: "12px",
                                height: "12px",
                                backgroundColor: item.color,
                                border: "1px solid #ccc",
                                borderRadius: "2px",
                                flexShrink: 0,
                                ...(isFullscreen && {
                                  width: "14px",
                                  height: "14px",
                                }),
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: isFullscreen ? "0.72rem" : "0.68rem",
                                color: theme.palette.text.secondary,
                                lineHeight: 1,
                                fontWeight: "medium",
                              }}
                            >
                              {item.value}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Collapse>
                )}

                {/* Descripción y fuente */}
                {legend.description && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      display: "block",
                      color: theme.palette.text.secondary,
                      lineHeight: 1.3,
                      fontSize: isFullscreen ? "0.76rem" : "0.72rem",
                    }}
                  >
                    {legend.description}
                  </Typography>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1,
                    pt: 1,
                    borderTop: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontStyle: "italic",
                      color: theme.palette.text.secondary,
                      fontSize: isFullscreen ? "0.72rem" : "0.68rem",
                    }}
                  >
                    {legend.source}
                    {legend.isFallback && " (Aproximada)"}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Footer con información */}
          <Box
            sx={{
              mt: 2,
              pt: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              textAlign: "center",
              flexShrink: 0,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: isFullscreen ? "0.75rem" : "0.7rem",
              }}
            >
              {legends.length} capa(s) activa(s)
            </Typography>
          </Box>
        </Paper>
      </Collapse>
    </>
  );

  // 🔥 USAR PORTAL SI ESTÁ EN FULLSCREEN, SINO RENDERIZAR NORMAL
  if (isFullscreen) {
    console.log("🚀 Renderizando leyenda en PORTAL (fullscreen)");
    return <Portal>{LegendContent}</Portal>;
  }

  console.log("📍 Renderizando leyenda NORMAL");
  return LegendContent;
};

export default CombinedMeteoLegend;
