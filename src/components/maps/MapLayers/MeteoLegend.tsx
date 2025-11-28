// components/MapLayers/MeteoLegend.tsx
import React from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { TransformedLegend } from "./WMSLayerManager";

interface MeteoLegendProps {
  legend: TransformedLegend;
  position?: { bottom?: number; right?: number; top?: number; left?: number };
}

export const MeteoLegend: React.FC<MeteoLegendProps> = ({
  legend,
  position = { bottom: 16, right: 16 },
}) => {
  const theme = useTheme();

  if (!legend) return null;

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        bottom:
          position.bottom !== undefined
            ? theme.spacing(position.bottom)
            : undefined,
        right:
          position.right !== undefined
            ? theme.spacing(position.right)
            : undefined,
        top:
          position.top !== undefined ? theme.spacing(position.top) : undefined,
        left:
          position.left !== undefined
            ? theme.spacing(position.left)
            : undefined,
        zIndex: 1000,
        padding: theme.spacing(2),
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        minWidth: "200px",
        maxWidth: "250px",
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Título */}
      <Typography
        variant="subtitle2"
        fontWeight="bold"
        gutterBottom
        sx={{ color: theme.palette.text.primary }}
      >
        {legend.title}
      </Typography>

      {/* Gradiente visual continuo */}
      <Box sx={{ mb: 1.5 }}>
        <Box
          sx={{
            height: "24px",
            background: `linear-gradient(to right, ${legend.gradient
              .map((item) => item.color)
              .join(", ")})`,
            borderRadius: "4px",
            border: "1px solid #ccc",
            marginBottom: "4px",
          }}
        />

        {/* Etiquetas de los extremos */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {legend.gradient.length > 0 && (
            <>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "medium",
                  color: theme.palette.text.secondary,
                }}
              >
                {legend.gradient[0].value}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: "medium",
                  color: theme.palette.text.secondary,
                }}
              >
                {legend.gradient[legend.gradient.length - 1].value}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      {/* Descripción */}
      {legend.description && (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            color: theme.palette.text.secondary,
            lineHeight: 1.3,
          }}
        >
          {legend.description}
        </Typography>
      )}

      {/* Fuente */}
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          display: "block",
          fontStyle: "italic",
          color: theme.palette.text.secondary,
          borderTop: `1px solid ${theme.palette.divider}`,
          pt: 0.5,
        }}
      >
        {legend.source}
        {legend.isFallback && " (Leyenda aproximada)"}
      </Typography>
    </Paper>
  );
};

// Componente para mostrar múltiples leyendas
interface MultipleMeteoLegendsProps {
  legends: TransformedLegend[];
  position?: { bottom?: number; right?: number; top?: number; left?: number };
}

export const MultipleMeteoLegends: React.FC<MultipleMeteoLegendsProps> = ({
  legends,
  position = { bottom: 16, right: 16 },
}) => {
  if (!legends || legends.length === 0) return null;

  return (
    <>
      {legends.map((legend, index) => (
        <MeteoLegend
          key={legend.layerId}
          legend={legend}
          position={{
            ...position,
            bottom: (position.bottom || 16) + index * 280, // Espacio entre leyendas
          }}
        />
      ))}
    </>
  );
};

export default MeteoLegend;
