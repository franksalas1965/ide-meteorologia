import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  useTheme,
} from "@mui/material";

interface FeatureProperty {
  [key: string]: any;
}

interface Feature {
  properties: FeatureProperty;
}

interface FeatureInfoDialogProps {
  open: boolean;
  onClose: () => void;
  featureInfo: {
    layerName?: string;
    features?: Feature[];
  };
}

// Lista de campos que no queremos mostrar
const HIDDEN_FIELDS = ["bbox", "geom", "geometry", "shape", "the_geom"];

// Extrae el nombre de la capa de forma más limpia
const extractLayerName = (fullName?: string) => {
  if (!fullName) return "DESCONOCIDO";
  return fullName.split(":").pop()?.trim().toUpperCase() || "DESCONOCIDO";
};

// Formatea valores para mostrar mejor
const formatValue = (value: any) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};

// Componente para mostrar cada propiedad
const PropertyDisplay = ({ name, value }: { name: string; value: any }) => {
  const theme = useTheme();
  const formattedValue = formatValue(value);

  if (formattedValue === null) {
    return (
      <Grid >
        <Typography variant="body2" component="div">
          <Box component="span" color="text.secondary">
            {name}:
          </Box>
          <Chip label="Nulo" size="small" sx={{ ml: 1 }} color="default" />
        </Typography>
      </Grid>
    );
  }

  return (
    <Grid >
      <Typography variant="body2" component="div">
        <Box component="span" color="text.secondary">
          {name}:
        </Box>
        <Box component="span" sx={{ ml: 1 }}>
          {formattedValue}
        </Box>
      </Typography>
    </Grid>
  );
};

export const FeatureInfoDialog = ({
  open,
  onClose,
  featureInfo,
}: FeatureInfoDialogProps) => {
  const theme = useTheme();
  const displayName = extractLayerName(featureInfo?.layerName);

  // Filtra las propiedades que no queremos mostrar
  const filteredFeatures = featureInfo?.features?.map((feature) => ({
    ...feature,
    properties: Object.fromEntries(
      Object.entries(feature.properties).filter(
        ([key]) => !HIDDEN_FIELDS.includes(key.toLowerCase())
      )
    ),
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          [theme.breakpoints.down("sm")]: { margin: 1 },
        },
      }}
    >
      <DialogTitle sx={{ py: 2 }}>
        <Box display="flex" alignItems="center">
          <Typography variant="subtitle1" color="text.secondary" mr={1}>
            Información de:
          </Typography>
          <Typography variant="h6" fontWeight={600}>
            {displayName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2 }}>
        {filteredFeatures?.length ? (
          filteredFeatures.map((feature, index) => (
            <Paper
              key={index}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "grey.900"
                    : "background.paper",
              }}
              elevation={0}
            >
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="subtitle1">
                  Elemento {index + 1}
                </Typography>
                {Object.keys(feature.properties).length > 0 && (
                  <Chip
                    label={`${
                      Object.keys(feature.properties).length
                    } propiedades`}
                    size="small"
                    sx={{ ml: 2 }}
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {Object.keys(feature.properties).length > 0 ? (
                <Grid container spacing={2}>
                  {Object.entries(feature.properties).map(([key, value]) => (
                    <PropertyDisplay key={key} name={key} value={value} />
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary" variant="body2">
                  No hay propiedades disponibles
                </Typography>
              )}
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary" variant="body2">
            No se encontraron elementos
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Button
          onClick={onClose}
          color="primary"
          variant="contained"
          size="medium"
          sx={{
            borderRadius: 1,
            textTransform: "none",
            px: 3,
            py: 1,
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};
