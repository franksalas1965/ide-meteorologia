// components/MapControls/LayerQueryDialog.tsx
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
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import LayersIcon from "@mui/icons-material/Layers";
import { styled } from "@mui/material/styles";
import L from "leaflet";
import * as turf from "@turf/turf";
import type * as GeoJSON from "geojson";
import { fetchWMSFields, fetchWFSValues } from "../../services/wmsService";
import { MapLayer } from "@/types/map-types";

type SpatialOperation =
  | "intersects"
  | "within"
  | "contains"
  | "overlaps"
  | "disjoint"
  | "crosses";

interface QueryResult {
  features: GeoJSON.Feature<GeoJSON.Geometry>[];
  layer1: string;
  layer2: string;
  operation: SpatialOperation;
}

const ModernDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: theme.shape.borderRadius * 2,
    width: 500,
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

interface LayerQueryDialogProps {
  open: boolean;
  onClose: () => void;
  map: L.Map | null;
  onQueryComplete: (results: QueryResult) => void;
}

export const LayerQueryDialog = ({
  open,
  onClose,
  map,
  onQueryComplete,
}: LayerQueryDialogProps) => {
  const theme = useTheme();
  const [availableLayers, setAvailableLayers] = useState<MapLayer[]>([]);
  const [layer1, setLayer1] = useState<MapLayer | null>(null);
  const [layer2, setLayer2] = useState<MapLayer | null>(null);
  const [field1, setField1] = useState<string>("");
  const [field2, setField2] = useState<string>("");
  const [value1, setValue1] = useState<string>("");
  const [value2, setValue2] = useState<string>("");
  const [fieldOptions1, setFieldOptions1] = useState<string[]>([]);
  const [fieldOptions2, setFieldOptions2] = useState<string[]>([]);
  const [valueOptions1, setValueOptions1] = useState<string[]>([]);
  const [valueOptions2, setValueOptions2] = useState<string[]>([]);
  const [loadingFields1, setLoadingFields1] = useState(false);
  const [loadingFields2, setLoadingFields2] = useState(false);
  const [loadingValues1, setLoadingValues1] = useState(false);
  const [loadingValues2, setLoadingValues2] = useState(false);
  const [operation, setOperation] = useState<SpatialOperation>("intersects");
  const [error, setError] = useState<string | null>(null);
  const [useFilterForLayer2, setUseFilterForLayer2] = useState(false);

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
              url: "",
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

  const capitalizeFirstLetter = useCallback((str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toUpperCase();
  }, []);

  useEffect(() => {
    if (!open) {
      setLayer1(null);
      setLayer2(null);
      setField1("");
      setField2("");
      setValue1("");
      setValue2("");
      setFieldOptions1([]);
      setFieldOptions2([]);
      setValueOptions1([]);
      setValueOptions2([]);
      setError(null);
      setUseFilterForLayer2(false);
    }
  }, [open]);

  const getWFSFields = useCallback((layer: L.Layer): string[] => {
    const fields = new Set<string>();
    const geoJsonLayer = layer as L.GeoJSON;

    if (geoJsonLayer.eachLayer) {
      geoJsonLayer.eachLayer((featureLayer: any) => {
        if (featureLayer.feature?.properties) {
          Object.keys(featureLayer.feature.properties).forEach((key) => {
            fields.add(key);
          });
        }
      });
    }

    return Array.from(fields);
  }, []);

  const getWFSValues = useCallback(
    (layer: L.Layer, field: string, limit: number): string[] => {
      const values = new Set<string>();
      const geoJsonLayer = layer as L.GeoJSON;

      if (geoJsonLayer.eachLayer) {
        geoJsonLayer.eachLayer((featureLayer: any) => {
          const value = featureLayer.feature?.properties?.[field];
          if (value !== undefined && value !== null) {
            values.add(String(value));
            if (values.size >= limit) return;
          }
        });
      }

      return Array.from(values).slice(0, limit);
    },
    []
  );

  // Memoiza fetchFieldsForLayer
  const fetchFieldsForLayer = useCallback(
    async (layer: MapLayer): Promise<string[]> => {
      if (layer.type === "WMS") {
        if (!layer.options.url) {
          throw new Error("La URL de la capa WMS no está definida");
        }

        const layerConfig = {
          url: layer.options.url,
          layers: layer.options.layers || layer.name,
          version: layer.options.version || "1.3.0",
        };

        const fields = await fetchWMSFields(layerConfig);
        return fields.filter(
          (field) => !["bbox", "geom", "geometry"].includes(field.toLowerCase())
        );
      } else if (layer.type === "WFS") {
        const fields = getWFSFields(layer.layer);
        return fields.filter(
          (field) => !["bbox", "geom", "geometry"].includes(field.toLowerCase())
        );
      }

      return [];
    },
    [getWFSFields]
  );

  // Memoiza fetchValuesForLayer
  const fetchValuesForLayer = useCallback(
    async (
      layer: MapLayer,
      field: string,
      limit: number
    ): Promise<string[]> => {
      if (layer.type === "WMS") {
        if (!layer.options.url) {
          throw new Error("La URL de la capa WMS no está definida");
        }

        const layerConfig = {
          url: layer.options.url,
          layers: layer.options.layers || layer.name,
          version: layer.options.version || "1.3.0",
        };

        return await fetchWFSValues(layerConfig, field, limit);
      } else if (layer.type === "WFS") {
        return getWFSValues(layer.layer, field, limit);
      }

      return [];
    },
    [getWFSValues]
  );

  const loadFields1 = useCallback(async () => {
    if (!layer1) return;

    setLoadingFields1(true);
    setError(null);

    try {
      const fields = await fetchFieldsForLayer(layer1);
      setFieldOptions1(fields);
      setField1(fields[0] || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setFieldOptions1([]);
      setField1("");
    } finally {
      setLoadingFields1(false);
    }
  }, [layer1, fetchFieldsForLayer]);

  const loadFields2 = useCallback(async () => {
    if (!layer2) return;

    setLoadingFields2(true);
    setError(null);

    try {
      const fields = await fetchFieldsForLayer(layer2);
      setFieldOptions2(fields);
      setField2(fields[0] || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setFieldOptions2([]);
      setField2("");
    } finally {
      setLoadingFields2(false);
    }
  }, [layer2, fetchFieldsForLayer]);

  const loadValues1 = useCallback(async () => {
    if (!layer1 || !field1) {
      setValueOptions1([]);
      return;
    }

    setLoadingValues1(true);
    setError(null);

    try {
      const values = await fetchValuesForLayer(layer1, field1, 10);
      setValueOptions1(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar valores");
      setValueOptions1([]);
    } finally {
      setLoadingValues1(false);
    }
  }, [layer1, field1, fetchValuesForLayer]);

  const loadValues2 = useCallback(async () => {
    if (!layer2 || !field2) {
      setValueOptions2([]);
      return;
    }

    setLoadingValues2(true);
    setError(null);

    try {
      const values = await fetchValuesForLayer(layer2, field2, 10);
      setValueOptions2(values);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar valores");
      setValueOptions2([]);
    } finally {
      setLoadingValues2(false);
    }
  }, [layer2, field2, fetchValuesForLayer]);

  useEffect(() => {
    loadFields1();
  }, [loadFields1]);

  useEffect(() => {
    loadFields2();
  }, [loadFields2]);

  useEffect(() => {
    loadValues1();
  }, [loadValues1]);

  useEffect(() => {
    if (useFilterForLayer2) {
      loadValues2();
    }
  }, [field2, loadValues2, useFilterForLayer2]);

  const handleOperationChange = useCallback(
    (event: SelectChangeEvent<SpatialOperation>) => {
      setOperation(event.target.value as SpatialOperation);
    },
    []
  );

  const executeQuery = useCallback(async () => {
    if (!map || !layer1 || !layer2) return;

    try {
      setError(null);

      // Obtener features de la capa 1 con filtro
      const features1 = await fetchFeaturesWithFilter(
        layer1,
        field1,
        value1,
        layer2,
        operation
      );

      // Obtener features de la capa 2, con o sin filtro según la configuración
      const features2 = useFilterForLayer2
        ? await fetchFeaturesWithFilter(layer2, field2, value2)
        : await fetchAllFeatures(layer2);

      // Realizar operación espacial
      if (layer1.type === "WFS" || layer2.type === "WFS") {
        const results = performSpatialOperation(
          features1.type
            ? features1
            : { type: "FeatureCollection", features: [] },
          features2.type
            ? features2
            : { type: "FeatureCollection", features: [] },
          operation
        );

        onQueryComplete({
          features: results,
          layer1: layer1.name,
          layer2: layer2.name,
          operation,
        });
      } else {
        onQueryComplete({
          features: features1.features,
          layer1: layer1.name,
          layer2: layer2.name,
          operation,
        });
      }

      onClose();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error en la consulta espacial"
      );
    }
  }, [
    map,
    layer1,
    layer2,
    field1,
    value1,
    field2,
    value2,
    useFilterForLayer2,
    operation,
    onQueryComplete,
    onClose,
  ]);

  const fetchAllFeatures = useCallback(
    async (layer: MapLayer): Promise<GeoJSON.FeatureCollection> => {
      if (layer.type === "WMS") {
        if (!layer.options?.url) throw new Error("URL de capa no definida");

        const wfsUrl = new URL(
          layer.options.url
            .replace("/wms", "/ows")
            .replace("/geoserver/wms", "/geoserver/ows")
        );

        const layerName = layer.options.workspace
          ? `${layer.options.workspace}:${layer.name}`
          : layer.name;

        const params: Record<string, string> = {
          service: "WFS",
          version: "2.0.0",
          request: "GetFeature",
          typeName: layerName,
          outputFormat: "application/json",
        };

        Object.entries(params).forEach(([key, val]) => {
          wfsUrl.searchParams.append(key, val);
        });

        const response = await fetch(wfsUrl.toString());
        if (!response.ok) {
          throw new Error(
            `Error WFS: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      } else if (layer.type === "WFS") {
        const features = getWFSFeatures(layer.layer);
        return {
          type: "FeatureCollection",
          features: features,
        };
      }

      throw new Error("Tipo de capa no soportado");
    },
    []
  );

  const getWFSFeatures = useCallback((layer: L.Layer): GeoJSON.Feature[] => {
    const features: GeoJSON.Feature[] = [];
    const geoJsonLayer = layer as L.GeoJSON;

    if (geoJsonLayer.eachLayer) {
      geoJsonLayer.eachLayer((featureLayer: any) => {
        if (featureLayer.feature) {
          features.push(featureLayer.feature);
        }
      });
    }

    return features;
  }, []);

  const fetchFeaturesWithFilter = useCallback(
    async (
      layer: MapLayer,
      field: string,
      value: string,
      otherLayer?: MapLayer,
      operation?: SpatialOperation
    ): Promise<GeoJSON.FeatureCollection> => {
      if (layer.type === "WMS") {
        if (!layer.options?.url) throw new Error("URL de capa no definida");

        const wfsUrl = new URL(
          layer.options.url
            .replace("/wms", "/ows")
            .replace("/geoserver/wms", "/geoserver/ows")
        );

        if (operation && !otherLayer) {
          throw new Error("Se requiere otherLayer para operaciones espaciales");
        }

        const layerName = layer.options.workspace
          ? `${layer.options.workspace}:${layer.name}`
          : layer.name;

        let otherLayerName = "";
        if (otherLayer) {
          otherLayerName = otherLayer.options?.workspace
            ? `${otherLayer.options.workspace}:${otherLayer.name}`
            : otherLayer.name;
        }

        const params: Record<string, string> = {
          service: "WFS",
          version: "2.0.0",
          request: "GetFeature",
          typeName: layerName,
          outputFormat: "application/json",
        };

        if (otherLayer && operation) {
          const filterXml = `
          <Filter xmlns="http://www.opengis.net/fes/2.0">
            <And>
              <PropertyIsEqualTo>
                <ValueReference>${field}</ValueReference>
                <Literal>${value}</Literal>
              </PropertyIsEqualTo>
              <${capitalizeFirstLetter(operation)}>
                <ValueReference>the_geom</ValueReference>
                <ValueReference>${otherLayerName}.the_geom</ValueReference>
              </${capitalizeFirstLetter(operation)}>
            </And>
          </Filter>
        `.replace(/\n\s+/g, "");

          params.filter = filterXml;
          params.join = otherLayerName;
        } else {
          params.cql_filter = `${field}='${value.replace(/'/g, "''")}'`;
        }

        Object.entries(params).forEach(([key, val]) => {
          wfsUrl.searchParams.append(key, val);
        });

        const response = await fetch(wfsUrl.toString());
        if (!response.ok) {
          throw new Error(
            `Error WFS: ${response.status} ${response.statusText}`
          );
        }
        return response.json();
      } else if (layer.type === "WFS") {
        const features = getWFSFeaturesWithFilter(layer.layer, field, value);
        return {
          type: "FeatureCollection",
          features: features,
        };
      }

      throw new Error("Tipo de capa no soportado");
    },
    [capitalizeFirstLetter]
  );

  const getWFSFeaturesWithFilter = useCallback(
    (layer: L.Layer, field: string, value: string): GeoJSON.Feature[] => {
      const features: GeoJSON.Feature[] = [];
      const geoJsonLayer = layer as L.GeoJSON;

      if (geoJsonLayer.eachLayer) {
        geoJsonLayer.eachLayer((featureLayer: any) => {
          const featureValue = featureLayer.feature?.properties?.[field];
          if (String(featureValue) === value && featureLayer.feature) {
            features.push(featureLayer.feature);
          }
        });
      }

      return features;
    },
    []
  );

  const performSpatialOperation = useCallback(
    (
      features1: GeoJSON.FeatureCollection,
      features2: GeoJSON.FeatureCollection,
      operation: SpatialOperation
    ): GeoJSON.Feature[] => {
      const results: GeoJSON.Feature[] = [];

      const normalizeGeometry = (
        feature: GeoJSON.Feature
      ): GeoJSON.Feature[] => {
        if (!feature.geometry) return [feature];

        if (feature.geometry.type === "MultiPolygon") {
          return feature.geometry.coordinates.map((polygonCoords) => ({
            ...feature,
            geometry: {
              type: "Polygon",
              coordinates: polygonCoords,
            },
          }));
        }

        return [feature];
      };

      features1.features.forEach((feature1) => {
        features2.features.forEach((feature2) => {
          if (!feature1.geometry || !feature2.geometry) return;

          const normalizedFeatures1 = normalizeGeometry(feature1);
          const normalizedFeatures2 = normalizeGeometry(feature2);

          normalizedFeatures1.forEach((normFeature1) => {
            normalizedFeatures2.forEach((normFeature2) => {
              let isMatch = false;

              try {
                switch (operation) {
                  case "intersects":
                    isMatch = turf.booleanIntersects(
                      normFeature1,
                      normFeature2
                    );
                    break;
                  case "within":
                    isMatch = turf.booleanWithin(normFeature1, normFeature2);
                    break;
                  case "contains":
                    isMatch = turf.booleanContains(normFeature1, normFeature2);
                    break;
                  case "overlaps":
                    isMatch = turf.booleanOverlap(normFeature1, normFeature2);
                    break;
                  case "disjoint":
                    isMatch = turf.booleanDisjoint(normFeature1, normFeature2);
                    break;
                  case "crosses":
                    isMatch = turf.booleanCrosses(normFeature1, normFeature2);
                    break;
                }
              } catch (error) {
                console.warn("Error en operación espacial:", error);
                return;
              }

              if (isMatch) {
                const combinedFeature: GeoJSON.Feature = {
                  type: "Feature",
                  geometry: normFeature1.geometry,
                  properties: {
                    ...normFeature1.properties,
                    ...normFeature2.properties,
                    __queryLayer1: layer1?.name,
                    __queryLayer2: layer2?.name,
                    __queryOperation: operation,
                  },
                };
                results.push(combinedFeature);
              }
            });
          });
        });
      });

      return results;
    },
    [layer1, layer2]
  );

  return (
    <ModernDialog open={open} onClose={onClose}>
      <ModernDialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          <LayersIcon fontSize="small" />
          <Typography variant="h6">Consulta entre Capas</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </ModernDialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && (
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          )}

          <Typography variant="subtitle1">Capa 1 (Filtrada)</Typography>
          <Autocomplete
            size="small"
            options={availableLayers}
            getOptionLabel={(option) => option.name}
            value={layer1}
            onChange={(_, newValue) => setLayer1(newValue)}
            renderInput={(params) => (
              <ModernTextField
                {...params}
                label="Seleccionar capa"
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

          {layer1 && (
            <>
              <Autocomplete
                size="small"
                options={fieldOptions1}
                getOptionLabel={(option) => option}
                value={field1}
                onChange={(_, newValue) => setField1(newValue || "")}
                loading={loadingFields1}
                renderInput={(params) => (
                  <ModernTextField
                    {...params}
                    label="Campo para filtrar"
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingFields1 && <CircularProgress size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Autocomplete
                size="small"
                freeSolo
                options={valueOptions1}
                inputValue={value1}
                onInputChange={(_, newValue) => setValue1(newValue)}
                loading={loadingValues1}
                renderInput={(params) => (
                  <ModernTextField
                    {...params}
                    label={`Valor en ${field1}`}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingValues1 && <CircularProgress size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </>
          )}

          <Divider sx={{ my: 1 }} />

          <Typography variant="subtitle1">Capa 2 (Referencia)</Typography>
          <Autocomplete
            size="small"
            options={availableLayers}
            getOptionLabel={(option) => option.name}
            value={layer2}
            onChange={(_, newValue) => setLayer2(newValue)}
            renderInput={(params) => (
              <ModernTextField
                {...params}
                label="Seleccionar capa"
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

          {layer2 && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useFilterForLayer2}
                    onChange={(e) => setUseFilterForLayer2(e.target.checked)}
                  />
                }
                label="Filtrar capa 2"
              />

              {useFilterForLayer2 && (
                <>
                  <Autocomplete
                    size="small"
                    options={fieldOptions2}
                    getOptionLabel={(option) => option}
                    value={field2}
                    onChange={(_, newValue) => setField2(newValue || "")}
                    loading={loadingFields2}
                    renderInput={(params) => (
                      <ModernTextField
                        {...params}
                        label="Campo para filtrar"
                        variant="outlined"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingFields2 && <CircularProgress size={18} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />

                  <Autocomplete
                    size="small"
                    freeSolo
                    options={valueOptions2}
                    inputValue={value2}
                    onInputChange={(_, newValue) => setValue2(newValue)}
                    loading={loadingValues2}
                    renderInput={(params) => (
                      <ModernTextField
                        {...params}
                        label={`Valor en ${field2}`}
                        variant="outlined"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingValues2 && <CircularProgress size={18} />}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </>
              )}
            </>
          )}

          <Divider sx={{ my: 1 }} />

          <FormControl fullWidth size="small">
            <InputLabel id="operation-select-label">
              Operación Espacial
            </InputLabel>
            <Select
              labelId="operation-select-label"
              value={operation}
              label="Operación Espacial"
              onChange={handleOperationChange}
            >
              <MenuItem value="intersects">Intersecta con</MenuItem>
              <MenuItem value="within">Dentro de</MenuItem>
              <MenuItem value="contains">Contiene a</MenuItem>
              <MenuItem value="overlaps">Se superpone con</MenuItem>
              <MenuItem value="disjoint">No intersecta con</MenuItem>
              <MenuItem value="crosses">Cruza con</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <PrimaryButton
          onClick={executeQuery}
          variant="contained"
          disabled={
            !layer1 ||
            !layer2 ||
            !field1 ||
            !value1 ||
            (useFilterForLayer2 && (!field2 || !value2))
          }
          startIcon={<SearchIcon />}
        >
          Ejecutar Consulta
        </PrimaryButton>
      </DialogActions>
    </ModernDialog>
  );
};
