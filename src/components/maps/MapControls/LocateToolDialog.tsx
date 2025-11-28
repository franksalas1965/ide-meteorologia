// components/MapControls/LocateToolDialog.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Stack,
  Chip,
  useTheme,
  IconButton,
  alpha,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/material/styles";
import L from "leaflet";
import { fetchWMSFields, fetchWFSValues } from "../../services/wmsService";
import { MapLayer } from "@/types/map-types";

// Estilos personalizados
const ModernDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.shape.borderRadius * 2,
    width: 420,
    maxWidth: "90vw",
    boxShadow: theme.shadows[10],
    background: theme.palette.background.paper,
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  },
}));

const ModernDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: `linear-gradient(135deg, ${
    theme.palette.primary.main
  } 0%, ${alpha(theme.palette.primary.dark, 0.8)} 100%)`,
  color: theme.palette.primary.contrastText,
}));

const ModernTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius,
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.light,
    },
  },
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  fontWeight: 600,
  textTransform: "none",
}));

interface WMSField {
  name: string;
  type: string | { name: string; localType: string };
}

interface LocateToolDialogProps {
  open: boolean;
  onClose: () => void;
  map: L.Map | null;
  onLocate: (layer: MapLayer, field: string, value: string) => void;
}

// Lista de campos que queremos excluir
const EXCLUDED_FIELDS = ["bbox", "geom", "geometry", "boundingBox", "extent"];

export const LocateToolDialog = ({
  open,
  onClose,
  map,
  onLocate,
}: LocateToolDialogProps) => {
  const theme = useTheme();
  const [availableLayers, setAvailableLayers] = useState<MapLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<MapLayer | null>(null);
  const [selectedField, setSelectedField] = useState<string>("");
  const [searchValue, setSearchValue] = useState("");
  const [fieldOptions, setFieldOptions] = useState<WMSField[]>([]);
  const [valueOptions, setValueOptions] = useState<string[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMapLayers = useCallback((): MapLayer[] => {
    if (!map) return [];

    const layers: MapLayer[] = [];
    const layerIds = new Set<string>();

    map.eachLayer((layer: L.Layer) => {
      let layerId = "";
      let newLayer: MapLayer | null = null;

      if (layer instanceof L.TileLayer && (layer as any).wmsParams) {
        const wmsParams = (layer as any).wmsParams;
        const layerUrl = (layer as any)._url || (layer as any).options?.url;

        if (wmsParams.layers && layerUrl) {
          layerId = `WMS-${wmsParams.layers}-${layerUrl}`;
          if (!layerIds.has(layerId)) {
            layerIds.add(layerId);
            newLayer = {
              layer,
              name: wmsParams.layers,
              type: "WMS",
              options: {
                ...wmsParams,
                url: layerUrl,
                version: wmsParams.version || "1.3.0",
              },
            };
          }
        }
      } else if (layer instanceof L.GeoJSON) {
        layerId = `GEOJSON-${(layer as any).options?.name || "unnamed"}`;
        if (!layerIds.has(layerId)) {
          layerIds.add(layerId);
          newLayer = {
            layer,
            name: (layer as any).options?.name || "Capa GeoJSON",
            type: "WFS",
            options: {
            url: ""
            },
          };
        }
      }

      if (newLayer) {
        layers.push(newLayer);
      }
    });

    return layers;
  }, [map]);

  useEffect(() => {
    if (open) {
      setAvailableLayers(getMapLayers());
    }
  }, [open, getMapLayers]);

  useEffect(() => {
    if (open) {
      setSelectedLayer(null);
      setSelectedField("");
      setSearchValue("");
      setFieldOptions([]);
      setValueOptions([]);
      setError(null);
    }
  }, [open]);

  const getWFSFields = useCallback((layer: L.Layer): string[] => {
    const fields = new Set<string>();
    const geoJsonLayer = layer as L.GeoJSON;

    if (geoJsonLayer.eachLayer) {
      geoJsonLayer.eachLayer((featureLayer: any) => {
        if (featureLayer.feature?.properties) {
          Object.keys(featureLayer.feature.properties).forEach((key) => {
            if (!EXCLUDED_FIELDS.includes(key.toLowerCase())) {
              fields.add(key);
            }
          });
        }
      });
    }

    return Array.from(fields);
  }, []);

  const getWFSValues = useCallback(
    (layer: L.Layer, field: string): string[] => {
      const values = new Set<string>();
      const geoJsonLayer = layer as L.GeoJSON;

      if (geoJsonLayer.eachLayer) {
        geoJsonLayer.eachLayer((featureLayer: any) => {
          const value = featureLayer.feature?.properties?.[field];
          if (value !== undefined && value !== null) {
            values.add(String(value));
          }
        });
      }

      return Array.from(values).slice(0, 10);
    },
    []
  );

  const loadFields = useCallback(async () => {
    if (!selectedLayer) return;

    setLoadingFields(true);
    setError(null);

    try {
      if (selectedLayer.type === "WMS") {
        if (!selectedLayer.options.url) {
          throw new Error("La URL de la capa WMS no está definida");
        }

        const layerConfig = {
          url: selectedLayer.options.url,
          layers: selectedLayer.options.layers || selectedLayer.name,
          version: selectedLayer.options.version || "1.3.0",
        };

        const fields = await fetchWMSFields(layerConfig);

        // Filtrar campos excluidos
        const filteredFields = fields.filter(
          (field) => !EXCLUDED_FIELDS.includes(field.toLowerCase())
        );

        if (filteredFields.length === 0) {
          throw new Error(
            "No se encontraron campos válidos después del filtrado"
          );
        }

        setFieldOptions(
          filteredFields.map((name) => ({ name, type: "string" }))
        );
        setSelectedField(filteredFields[0] || "");
      } else if (selectedLayer.type === "WFS") {
        const fields = getWFSFields(selectedLayer.layer);
        if (fields.length > 0) {
          setFieldOptions(fields.map((name) => ({ name, type: "string" })));
          setSelectedField(fields[0]);
        } else {
          throw new Error("La capa no contiene propiedades válidas");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setFieldOptions([]);
      setSelectedField("");
    } finally {
      setLoadingFields(false);
    }
  }, [selectedLayer, getWFSFields]);

  useEffect(() => {
    loadFields();
  }, [selectedLayer, loadFields]);

  const loadValues = useCallback(async () => {
    if (!selectedLayer || !selectedField) {
      setValueOptions([]);
      return;
    }

    setLoadingValues(true);
    setError(null);

    try {
      if (selectedLayer.type === "WMS") {
        if (!selectedLayer.options.url) {
          throw new Error("La URL de la capa WMS no está definida");
        }

        const layerConfig = {
          url: selectedLayer.options.url,
          layers: selectedLayer.options.layers || selectedLayer.name,
          version: selectedLayer.options.version || "1.3.0",
        };

        const values = await fetchWFSValues(layerConfig, selectedField, 10);
        setValueOptions(values);
      } else if (selectedLayer.type === "WFS") {
        const values = getWFSValues(selectedLayer.layer, selectedField);
        setValueOptions(values);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar valores");
      setValueOptions([]);
    } finally {
      setLoadingValues(false);
    }
  }, [selectedLayer, selectedField, getWFSValues]);

  useEffect(() => {
    loadValues();
  }, [selectedField, loadValues]);

  const handleLocate = () => {
    if (!selectedLayer || !selectedField || !searchValue) return;
    onLocate(selectedLayer, selectedField, searchValue);
    onClose();
  };

  return (
    <ModernDialog open={open} onClose={onClose}>
      <ModernDialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <LocationOnIcon fontSize="small" />
          <Typography variant="h6">Localizar Elemento</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </ModernDialogTitle>

      <DialogContent>
        <Stack spacing={2}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <Autocomplete
            size="small"
            options={availableLayers}
            getOptionLabel={(option) => option.name}
            value={selectedLayer}
            onChange={(_, newValue) => setSelectedLayer(newValue)}
            renderInput={(params) => (
              <ModernTextField
                {...params}
                label="Capa a consultar"
                variant="outlined"
                fullWidth
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <Chip
                  label={option.type}
                  size="small"
                  color={option.type === "WMS" ? "primary" : "secondary"}
                />
                <Typography ml={1}>{option.name}</Typography>
              </li>
            )}
          />

          {selectedLayer && (
            <>
              <Autocomplete
                size="small"
                options={fieldOptions}
                getOptionLabel={(option) => option.name}
                value={
                  fieldOptions.find((f) => f.name === selectedField) || null
                }
                onChange={(_, newValue) => {
                  setSelectedField(newValue?.name || "");
                }}
                loading={loadingFields}
                renderInput={(params) => (
                  <ModernTextField
                    {...params}
                    label="Campo de búsqueda"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingFields && <CircularProgress size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Box>
                <Autocomplete
                  size="small"
                  freeSolo
                  options={valueOptions}
                  inputValue={searchValue}
                  onInputChange={(_, newValue) => setSearchValue(newValue)}
                  loading={loadingValues}
                  renderInput={(params) => (
                    <ModernTextField
                      {...params}
                      label={`Valor en ${selectedField}`}
                      variant="outlined"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingValues && <CircularProgress size={18} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
                <Button
                  variant="contained"
                  startIcon={<SearchIcon />}
                  onClick={loadValues}
                  disabled={!selectedField || loadingValues}
                  fullWidth
                  sx={{ mt: 1 }}
                >
                  Buscar Valores
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <PrimaryButton
          onClick={handleLocate}
          variant="contained"
          disabled={!selectedLayer || !selectedField || !searchValue}
        >
          Localizar
        </PrimaryButton>
      </DialogActions>
    </ModernDialog>
  );
};
