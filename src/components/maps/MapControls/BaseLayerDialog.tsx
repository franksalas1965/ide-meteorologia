import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  useTheme,
  styled,
  IconButton,
  Stack,
  CircularProgress,
} from "@mui/material";
import L from "leaflet";
import CloseIcon from "@mui/icons-material/Close";

interface BaseLayer {
  id: string;
  name: string;
  url: string;
  thumbnail: string;
  attribution: string;
}

interface BaseLayerDialogProps {
  open: boolean;
  onClose: () => void;
  map: L.Map | null;
}

const LayerCard = styled(Box)(({ theme }) => ({
  position: "relative",
  width: "80px",
  height: "80px",
  borderRadius: "8px",
  overflow: "hidden",
  cursor: "pointer",
  transition: "all 0.3s ease",
  boxShadow: theme.shadows[1],
  marginTop:"5px",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[4],
    "& .layer-overlay": {
      backgroundColor: "rgba(0, 0, 0, 0.2)",
    },
  },
  "&.selected": {
    boxShadow: `0 0 0 3px ${theme.palette.primary.main}`,
    "& .layer-overlay": {
      backgroundColor: "rgba(25, 118, 210, 0.3)",
    },
  },
}));

const LayerOverlay = styled(Box)({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  padding: "8px",
  transition: "background-color 0.3s ease",
});

export const BaseLayerDialog = ({
  open,
  onClose,
  map,
}: BaseLayerDialogProps) => {
  const theme = useTheme();
  const [baseLayers, setBaseLayers] = useState<BaseLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [loadingLayer, setLoadingLayer] = useState<string | null>(null);
  const [currentBaseLayer, setCurrentBaseLayer] = useState<L.TileLayer | null>(
    null
  );

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const configUrl = process.env.NEXT_PUBLIC_CONFIG_URL || "/config";
        const response = await fetch(`${configUrl}/baseLayers.json`);

        const data = await response.json();
        setBaseLayers(data);

        if (map) {
          map.eachLayer((layer: L.Layer) => {
            if (layer instanceof L.TileLayer) {
              const tileLayer = layer as L.TileLayer;
              const url = (tileLayer as any)._url || "";
              const foundLayer = data.find((bl: BaseLayer) =>
                url.includes(bl.url.split("{")[0])
              );
              if (foundLayer) {
                setSelectedLayer(foundLayer.id);
                setCurrentBaseLayer(tileLayer);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error loading base layers:", error);
      }
    };

    if (open) loadConfig();
  }, [open, map]);

  const handleLayerChange = async (layer: BaseLayer) => {
    if (loadingLayer || !map) return;

    setLoadingLayer(layer.id);
    setSelectedLayer(layer.id);

    try {
      // Crear la nueva capa
      const newLayer = L.tileLayer(layer.url, {
        attribution: layer.attribution,
        zIndex: -1,
      });

      // Añadir la nueva capa primero (invisible hasta que cargue)
      newLayer.addTo(map);

      // Esperar a que cargue al menos un tile
      newLayer.on("load", () => {
        // Eliminar la capa anterior solo después de que la nueva haya cargado
        if (currentBaseLayer && map.hasLayer(currentBaseLayer)) {
          map.removeLayer(currentBaseLayer);
        }
        setCurrentBaseLayer(newLayer);
        setLoadingLayer(null);
      });

      // Timeout de seguridad por si falla la carga
      const timeout = setTimeout(() => {
        setLoadingLayer(null);
      }, 5000);

      // Limpiar el timeout cuando la capa cargue
      newLayer.on("load", () => clearTimeout(timeout));
    } catch (error) {
      console.error("Error changing base layer:", error);
      setLoadingLayer(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "12px",
          background: theme.palette.background.paper,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6">Seleccionar Mapa Base</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack
          direction="row"
          gap={2}
          flexWrap="wrap"
          justifyContent="center"
          sx={{
            paddingTop: "5px", 
            alignItems: "flex-start",
          }}
        >
          {baseLayers.map((layer: BaseLayer) => (
            <LayerCard
              key={layer.id}
              onClick={() => handleLayerChange(layer)}
              className={selectedLayer === layer.id ? "selected" : ""}
              sx={{ position: "relative" }}
            >
              <Box
                component="img"
                src={layer.thumbnail}
                alt={layer.name}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: loadingLayer === layer.id ? 0.7 : 1,
                }}
              />
              <LayerOverlay className="layer-overlay">
                <Typography
                  variant="subtitle2"
                  color="white"
                  fontWeight={500}
                  sx={{
                    textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                    textAlign: "center",
                  }}
                >
                  {layer.name}
                </Typography>
              </LayerOverlay>

              {loadingLayer === layer.id && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                  }}
                >
                  <CircularProgress size={24} color="primary" />
                </Box>
              )}
            </LayerCard>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
