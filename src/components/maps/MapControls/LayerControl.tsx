import { useState } from "react";
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DragHandle,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import L from "leaflet";
import { WMSLayer } from "@/types/map-types";

interface Layer {
  id: string;
  name: string;
  layer: L.Layer;
  visible: boolean;
  type: string;
}

interface LayerItemProps {
  layer: WMSLayer; 
  index: number;
}

interface LayerControlProps {
  map: L.Map;
  layers: WMSLayer[]; 
  onLayersChange: (newLayers: WMSLayer[]) => void; 
  showCloseButton?: boolean;
  onClose?: () => void;
}

export const LayerControl = ({
  map,
  layers,
  onLayersChange,
  showCloseButton = true,
  onClose = () => {},
}: LayerControlProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const updateMapLayersOrder = (newOrder: WMSLayer[]) => {
    // Primero removemos todas las capas visibles
    newOrder.forEach((layer) => {
      if (layer.visible && layer.layer && map.hasLayer(layer.layer)) {
        map.removeLayer(layer.layer);
      }
    });

    // Luego las añadimos en el nuevo orden
    newOrder.forEach((layer) => {
      if (layer.visible && layer.layer) {
        map.addLayer(layer.layer);
      }
    });
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    if (!result.destination) return;

    const items = Array.from(layers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onLayersChange(items);
    updateMapLayersOrder(items);
  };

  const moveLayer = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= layers.length) return;

    const items = [...layers];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];

    onLayersChange(items);
    updateMapLayersOrder(items);
  };

  interface LayerItemProps {
    layer: WMSLayer; // Usa WMSLayer directamente
    index: number;
  }

  const LayerItem = ({ layer, index }: LayerItemProps) => (
    <Draggable key={layer.id} draggableId={layer.id} index={index}>
      {(provided) => (
        <ListItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          sx={{
            backgroundColor: isDragging ? "action.selected" : "inherit",
            transition: "background-color 0.2s ease",
          }}
          secondaryAction={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(index, "up");
                }}
                disabled={index === 0}
                sx={{ mr: 0.5 }}
                aria-label="Mover capa arriba"
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(index, "down");
                }}
                disabled={index === layers.length - 1}
                sx={{ mr: 1 }}
                aria-label="Mover capa abajo"
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <Box {...provided.dragHandleProps} sx={{ cursor: "grab" }}>
                <DragHandle fontSize="small" />
              </Box>
            </Box>
          }
        >
          <ListItemText
            primary={layer.name || `Capa ${layer.layerId}`}
            secondary={layer.type}
            primaryTypographyProps={{
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
            secondaryTypographyProps={{
              fontSize: "0.75rem",
            }}
          />
        </ListItem>
      )}
    </Draggable>
  );

  const Header = () => (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        p: 1,
        bgcolor: "primary.main",
        color: "primary.contrastText",
        minHeight: "48px",
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ flexGrow: 1, px: 1, fontWeight: 500 }}
      >
        Orden de Capas
      </Typography>
      {showCloseButton && (
        <IconButton
          onClick={() => onClose()} // Asegúrate de llamar a onClose aquí
          size="small"
          color="inherit"
          sx={{ mr: 0.5 }}
          aria-label="Cerrar panel de capas"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  const EmptyState = () => (
    <Box sx={{ p: 3, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">
        No hay capas disponibles
      </Typography>
    </Box>
  );

  const LayerList = () => (
    <DragDropContext
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
    >
      <Droppable droppableId="layers">
        {(provided) => (
          <List
            ref={provided.innerRef}
            {...provided.droppableProps}
            dense
            sx={{
              overflowY: "auto",
              padding: 0,
              "& .MuiListItem-root": {
                px: 2,
                py: 1,
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              },
            }}
          >
            {layers.map((layer, index) => (
              <LayerItem key={layer.id} layer={layer} index={index} />
            ))}
            {provided.placeholder}
          </List>
        )}
      </Droppable>
    </DragDropContext>
  );

  return (
    <Paper
      sx={{
        position: "absolute",
        top: 80,
        right: 16,
        zIndex: 1000,
        width: 300,
        maxHeight: "60vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        boxShadow: 3,
        borderRadius: 1,
      }}
      elevation={3}
    >
      <Header />
      <Divider />
      <Box sx={{ overflowY: "auto", flexGrow: 1 }}>
        {layers.length === 0 ? <EmptyState /> : <LayerList />}
      </Box>
    </Paper>
  );
};
