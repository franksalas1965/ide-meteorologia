"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme, useMediaQuery } from "@mui/material";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Typography,
  Box,
  Skeleton,
  TextField,
  InputAdornment,
  IconButton,
  Toolbar,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Map as MapIcon,
  Layers as LayersIcon,
  SatelliteAlt as SatelliteIcon,
  BarChart as ChartIcon,
  Apps as AppsIcon,
  Image as ImageIcon,
  Public as PublicIcon,
  Terrain as TerrainIcon,
  PieChart as PieChartIcon,
  Search as SearchIcon,
  ZoomIn as ZoomInIcon,
} from "@mui/icons-material";
import InfoIcon from "@mui/icons-material/Info";
import CloseIcon from "@mui/icons-material/Close";
import { MenuAction } from "@/types/menu";
import { WMSLayer, WMSLayerBounds } from "@/types/map-types";
import { getWMSLayerBounds } from "../../utils/wmsUtils";
import { LatLngBoundsExpression } from "leaflet";

// Definición de tipos
interface MenuItem {
  name: string;
  route?: string;
  subMenus?: SubMenuItem[];
  [key: string]: any;
}

interface SubMenuItem {
  name: string;
  subSubMenu?: SubSubMenuItem[];
  actions?: MenuAction[];
  [key: string]: any;
}

interface SubSubMenuItem {
  name: string;
  actions: MenuAction[];
  [key: string]: any;
}

interface MenuGroup {
  title: string;
  menus: MenuItem[];
}

export interface LayerState {
  [key: string]: {
    isActive: boolean;
    config?: WMSLayer;
  };
}

interface ActionItemProps {
  action: MenuAction;
  level?: number;
  onItemClick?: () => void;
  searchTerm: string;
  layerState: LayerState;
  onLayerToggle: (layerId: string, isActive?: boolean) => void;
  onImageToggle: (imageId: string, isActive?: boolean) => void;
  onActionClick: (actionType: string, action: MenuAction) => void;
  infoMode: boolean;
  onInfoModeChange: (isActive: boolean) => void;
}

interface SidebarProps {
  menuGroups: MenuGroup[];
  loading: boolean;
  error: string | null;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  layerState: LayerState;
  onLayerToggle: (layerId: string, isActive?: boolean) => void;
  onImageToggle: (imageId: string, isActive?: boolean) => void;
  onActionClick: (actionType: string, action: MenuAction) => void;
}

// Función utilitaria para iconos
const getMenuIcon = (name: string) => {
  const icons: Record<string, JSX.Element> = {
    "visor de mapas": <MapIcon />,
    "visor de imágenes": <SatelliteIcon />,
    "mapas estadísticos": <ChartIcon />,
    "mapas generales": <PublicIcon />,
    geologia: <TerrainIcon />,
    "imágenes satelitales": <SatelliteIcon />,
    "imágenes aéreas": <ImageIcon />,
    población: <PieChartIcon />,
    economía: <PieChartIcon />,
  };

  return icons[name.toLowerCase()] || <AppsIcon />;
};

// Función para convertir WMSLayerBounds a LatLngBoundsExpression
const convertToLatLngBounds = (bounds: WMSLayerBounds): LatLngBoundsExpression => {
  return [
    [bounds.south, bounds.west], 
    [bounds.north, bounds.east], 
  ];
};

// Componente ActionItem refactorizado
const ActionItem = ({
  action,
  level = 0,
  searchTerm,
  layerState,
  onItemClick,
  onLayerToggle,
  onImageToggle,
  onActionClick,
  infoMode,
  onInfoModeChange,
}: ActionItemProps) => {
  const [isZooming, setIsZooming] = useState(false);
  const isVisible = action.name.toLowerCase().includes(searchTerm.toLowerCase());

  if (!isVisible) return null;

  const handleZoomClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!action.layerConfig) return;

    try {
      setIsZooming(true);
      const bounds = await getWMSLayerBounds(
        action.layerConfig.url,
        action.layerConfig.layers
      );

      if (bounds) {
        const latLngBounds = convertToLatLngBounds(bounds);
        onActionClick("zoomToLayer", {
          ...action,
          layerConfig: { ...action.layerConfig, bounds: latLngBounds },
        });
      }
    } catch (error) {
      console.error("Error al obtener bounds de la capa:", error);
    } finally {
      setIsZooming(false);
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMode = !infoMode;
    onInfoModeChange(newMode);
    onActionClick("toggleInfoMode", {
      action: "toggleInfoMode",
      payload: {
        forceMode: newMode,
        layer: newMode ? action.layerConfig : null,
      },
      name: "Toggle Info Mode",
      layerConfig: action.layerConfig,
    });
  };

  const shouldShowCheckbox = [
    "activateLayer",
    "loadImageSentinel",
    "loadImage",
  ].includes(action.action);

  const layerId = action.layerConfig?.layerId || action.imageId;
  const isChecked = layerId ? layerState[layerId]?.isActive || false : false;

  const handleClick = () => {
    onActionClick(action.action, action);
    onItemClick?.();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const isActive = e.target.checked;

    if (action.layerConfig?.layerId) {
      onLayerToggle(action.layerConfig.layerId, isActive);
    } else if (action.imageId) {
      onImageToggle(action.imageId, isActive);
    }
  };

  return (
    <ListItem
      sx={{
        pl: 8 + level * 4,
        borderRadius: "8px",
        mb: 0.25,
        "&:hover": { backgroundColor: "action.hover", cursor: "pointer" },
        py: 0.25,
      }}
      onClick={handleClick}
    >
      {shouldShowCheckbox && (
        <Checkbox
          checked={isChecked}
          onChange={handleCheckboxChange}
          sx={{ mr: 1, py: 0 }}
          size="small"
        />
      )}
      <ListItemIcon sx={{ minWidth: 36 }}>
        <LayersIcon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={action.name}
        primaryTypographyProps={{ fontSize: "0.875rem" }}
      />

      {action.action === "activateLayer" && (
        <Box
          sx={{
            display: "flex",
            gap: 0,
            ml: 1,
            "& .MuiIconButton-root": {
              padding: "4px",
              margin: "0 -4px",
            },
          }}
        >
          <IconButton
            size="small"
            onClick={handleZoomClick}
            title="Zoom a la extensión de la capa"
            disabled={isZooming}
          >
            {isZooming ? (
              <CircularProgress size={20} />
            ) : (
              <ZoomInIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            size="small"
            onClick={handleInfoClick}
            title="Mostrar información de la capa"
            sx={{
              color: infoMode ? "primary.main" : "inherit",
              backgroundColor: infoMode ? "action.selected" : "transparent",
              "&:hover": {
                backgroundColor: infoMode ? "primary.light" : "action.hover",
              },
            }}
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </ListItem>
  );
};

// Función para verificar si un elemento o sus hijos coinciden con el término de búsqueda
const hasMatchingContent = (
  item: MenuItem | SubMenuItem | SubSubMenuItem,
  searchTerm: string
): boolean => {
  if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
    return true;
  }

  if ("subMenus" in item && item.subMenus) {
    return item.subMenus.some((subMenu: SubMenuItem) =>
      hasMatchingContent(subMenu, searchTerm)
    );
  }

  if ("subSubMenu" in item && item.subSubMenu) {
    return item.subSubMenu.some((subSubMenu: SubSubMenuItem) =>
      hasMatchingContent(subSubMenu, searchTerm)
    );
  }

  if ("actions" in item && item.actions) {
    return item.actions.some((action: MenuAction) =>
      action.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return false;
};

// Componente SubSubMenuItem refactorizado
const SubSubMenuItemComponent = ({
  item,
  level = 0,
  expandedItems,
  setExpandedItems,
  searchTerm,
  layerState,
  onLayerToggle,
  onImageToggle,
  onActionClick,
}: {
  item: SubSubMenuItem;
  level?: number;
  expandedItems: Record<string, boolean>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  searchTerm: string;
  layerState: LayerState;
  onLayerToggle: (layerId: string, isActive?: boolean) => void;
  onImageToggle: (imageId: string, isActive?: boolean) => void;
  onActionClick: (actionType: string, action: MenuAction) => void;
}) => {
  const itemKey = `subsub-${item.name}`;
  const expanded = expandedItems[itemKey] || false;
  const [activeInfoAction, setActiveInfoAction] = useState<string | null>(null);

  if (!hasMatchingContent(item, searchTerm)) {
    return null;
  }

  const handleInfoModeChange = (actionId: string, isActive: boolean) => {
    setActiveInfoAction(isActive ? actionId : null);
  };

  return (
    <>
      <ListItem
        sx={{
          pl: 6 + level * 4,
          "&:hover": { backgroundColor: "action.hover", cursor: "pointer" },
        }}
        onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }))}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          {getMenuIcon(item.name)}
        </ListItemIcon>
        <ListItemText primary={item.name} />
        {expanded ? <ExpandLess /> : <ExpandMore />}
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {item.actions.map((action, idx) => {
            const actionId = `${item.name}-action-${idx}`;
            return (
              <ActionItem
                key={actionId}
                action={action}
                level={level}
                searchTerm={searchTerm}
                layerState={layerState}
                onLayerToggle={onLayerToggle}
                onImageToggle={onImageToggle}
                onActionClick={onActionClick}
                infoMode={activeInfoAction === actionId}
                onInfoModeChange={(isActive) => handleInfoModeChange(actionId, isActive)}
              />
            );
          })}
        </List>
      </Collapse>
    </>
  );
};

// Componente SubMenuItem refactorizado
const SubMenuItemComponent = ({
  item,
  level = 0,
  expandedItems,
  setExpandedItems,
  searchTerm,
  layerState,
  onLayerToggle,
  onImageToggle,
  onActionClick,
}: {
  item: SubMenuItem;
  level?: number;
  expandedItems: Record<string, boolean>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  searchTerm: string;
  layerState: LayerState;
  onLayerToggle: (layerId: string, isActive?: boolean) => void;
  onImageToggle: (imageId: string, isActive?: boolean) => void;
  onActionClick: (actionType: string, action: MenuAction) => void;
}) => {
  const itemKey = `sub-${item.name}`;
  const expanded = expandedItems[itemKey] || false;
  const [activeInfoAction, setActiveInfoAction] = useState<string | null>(null);

  if (!hasMatchingContent(item, searchTerm)) {
    return null;
  }

  const handleInfoModeChange = (actionId: string, isActive: boolean) => {
    setActiveInfoAction(isActive ? actionId : null);
  };

  return (
    <>
      <ListItem
        sx={{
          pl: 4 + level * 4,
          "&:hover": { backgroundColor: "action.hover", cursor: "pointer" },
        }}
        onClick={() => setExpandedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }))}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>
          {getMenuIcon(item.name)}
        </ListItemIcon>
        <ListItemText primary={item.name} />
        {(item.subSubMenu || item.actions) && (expanded ? <ExpandLess /> : <ExpandMore />)}
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {item.subSubMenu?.map((subSubItem, idx) => (
            <SubSubMenuItemComponent
              key={`${item.name}-subsub-${idx}`}
              item={subSubItem}
              level={level}
              expandedItems={expandedItems}
              setExpandedItems={setExpandedItems}
              searchTerm={searchTerm}
              layerState={layerState}
              onLayerToggle={onLayerToggle}
              onImageToggle={onImageToggle}
              onActionClick={onActionClick}
            />
          ))}
          {item.actions?.map((action, idx) => {
            const actionId = `${item.name}-action-${idx}`;
            return (
              <ActionItem
                key={actionId}
                action={action}
                level={level}
                searchTerm={searchTerm}
                layerState={layerState}
                onLayerToggle={onLayerToggle}
                onImageToggle={onImageToggle}
                onActionClick={onActionClick}
                infoMode={activeInfoAction === actionId}
                onInfoModeChange={(isActive) => handleInfoModeChange(actionId, isActive)}
              />
            );
          })}
        </List>
      </Collapse>
    </>
  );
};

// Componente MenuItem refactorizado
const MenuItemComponent = ({
  item,
  expandedItems,
  setExpandedItems,
  searchTerm,
  layerState,
  onLayerToggle,
  onImageToggle,
  onActionClick,
  onItemClick,
}: {
  item: MenuItem;
  expandedItems: Record<string, boolean>;
  setExpandedItems: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  searchTerm: string;
  layerState: LayerState;
  onLayerToggle: (layerId: string, isActive?: boolean) => void;
  onImageToggle: (imageId: string, isActive?: boolean) => void;
  onActionClick: (actionType: string, action: MenuAction) => void;
  onItemClick?: () => void;
}) => {
  const pathname = usePathname();
  const itemKey = `menu-${item.name}`;
  const expanded = expandedItems[itemKey] || false;

  if (!hasMatchingContent(item, searchTerm)) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    if (item.subMenus) {
      e.preventDefault();
      setExpandedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
    }
    onItemClick?.();
  };

  return (
    <div>
      <ListItem
        component={item.route ? Link : "div"}
        href={item.route || ""}
        sx={{
          pl: 2,
          backgroundColor: pathname === item.route ? "primary.light" : "inherit",
          "&:hover": {
            backgroundColor: "primary.light",
            opacity: 0.8,
            cursor: "pointer",
          },
        }}
        onClick={handleClick}
      >
        <ListItemIcon sx={{ color: "primary.main" }}>
          {getMenuIcon(item.name)}
        </ListItemIcon>
        <ListItemText primary={item.name} />
        {item.subMenus && (expanded ? <ExpandLess /> : <ExpandMore />)}
      </ListItem>

      {item.subMenus && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.subMenus.map((subItem, idx) => (
              <SubMenuItemComponent
                key={`${item.name}-sub-${idx}`}
                item={subItem}
                level={1}
                expandedItems={expandedItems}
                setExpandedItems={setExpandedItems}
                searchTerm={searchTerm}
                layerState={layerState}
                onLayerToggle={onLayerToggle}
                onImageToggle={onImageToggle}
                onActionClick={onActionClick}
              />
            ))}
          </List>
        </Collapse>
      )}
    </div>
  );
};

// Componente Sidebar principal refactorizado
export default function Sidebar({
  menuGroups,
  loading,
  error,
  mobileOpen,
  handleDrawerToggle,
  layerState,
  onLayerToggle,
  onImageToggle,
  onActionClick,
}: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Auto-expand items cuando se busca


      const expandParents = (
        item: MenuItem | SubMenuItem | SubSubMenuItem,
        searchTerm: string,
        newExpandedItems: Record<string, boolean>,
        parentKeys: string[] = []
      ) => {
        if (item.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          parentKeys.forEach(key => {
            newExpandedItems[key] = true;
          });
        }
      
        if ('subMenus' in item && item.subMenus) {
          item.subMenus.forEach((subMenu: SubMenuItem) => {
            expandParents(
              subMenu, 
              searchTerm, 
              newExpandedItems, 
              [...parentKeys, `menu-${item.name}`]
            );
          });
        }
      
        if ('subSubMenu' in item && item.subSubMenu) {
          item.subSubMenu.forEach((subSubMenu: SubSubMenuItem) => {
            expandParents(
              subSubMenu, 
              searchTerm, 
              newExpandedItems, 
              [...parentKeys, `sub-${item.name}`]
            );
          });
        }
      
        if ('actions' in item && item.actions) {
          const hasMatchingAction = item.actions.some((action: MenuAction) => 
            action.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          if (hasMatchingAction) {
            parentKeys.forEach(key => {
              newExpandedItems[key] = true;
            });
          }
        }
      };


  useEffect(() => {
    if (searchTerm) {
      const newExpandedItems: Record<string, boolean> = {};

      menuGroups.forEach((group: MenuGroup) => {
        group.menus.forEach((menu: MenuItem) => {
          expandParents(menu, searchTerm, newExpandedItems);
        });
      });

      setExpandedItems((prev) => ({ ...prev, ...newExpandedItems }));
    }
  }, [searchTerm, menuGroups]);



  // Filtrar grupos de menú basados en el término de búsqueda
  const filteredMenuGroups = useMemo(() => {
    if (!searchTerm) return menuGroups;

    return menuGroups
      .map(group => ({
        ...group,
        menus: group.menus.filter(menu => hasMatchingContent(menu, searchTerm)),
      }))
      .filter(group => group.menus.length > 0);
  }, [menuGroups, searchTerm]);

  return (
    <Box component="nav">
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          position: "relative",
          zIndex: theme.zIndex.drawer,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 320,
            boxSizing: "border-box",
            borderRight: "none",
            boxShadow: 3,
            backgroundColor: "#70F074FF",
            borderRadius: "12px",
            marginX: "6px",
            marginTop: isMobile ? "0px" : "6px",
            height: isMobile ? "100%" : "calc(100vh - 120px - 12px)",
            position: "relative",
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "10px",
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-track": {
              borderRadius: "10px",
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              borderRadius: "10px",
              backgroundColor: "transparent",
            },
            "&:hover::-webkit-scrollbar-thumb": { backgroundColor: "#70F074" },
            "&:hover::-webkit-scrollbar-track": { backgroundColor: "#f0f0f0" },
            scrollbarWidth: "thin",
            scrollbarColor: "transparent transparent",
            "&:hover": { scrollbarColor: "#70F074 #f0f0f0" },
          },
        }}
      >
        <Box sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" color="#052906FF">
            {process.env.NEXT_PUBLIC_TITULO}
          </Typography>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              position: "absolute",
              top: 15,
              right: 8,
              zIndex: 1,
              color: "#052906FF",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.9)" },
              width: 24,
              height: 24,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Toolbar sx={{ p: 1, display: "flex", flexDirection: "column", gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar menú..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>

        <Divider />

        {loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={40} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, color: "error.main" }}>
            <Typography variant="body2">Error al cargar el menú:</Typography>
            <Typography variant="body2">{error}</Typography>
          </Box>
        ) : (
          <List>
            {filteredMenuGroups.map((group, groupIdx) => (
              <div key={`group-${groupIdx}`}>
                <ListItem>
                  <ListItemIcon>
                    <AppsIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={group.title}
                    primaryTypographyProps={{ fontWeight: "bold" }}
                  />
                </ListItem>
                {group.menus.map((menu, menuIdx) => (
                  <MenuItemComponent
                    key={`${group.title}-menu-${menuIdx}`}
                    item={menu}
                    onItemClick={isMobile ? handleDrawerToggle : undefined}
                    expandedItems={expandedItems}
                    setExpandedItems={setExpandedItems}
                    searchTerm={searchTerm}
                    layerState={layerState}
                    onLayerToggle={onLayerToggle}
                    onImageToggle={onImageToggle}
                    onActionClick={onActionClick}
                  />
                ))}
              </div>
            ))}
          </List>
        )}
      </Drawer>
    </Box>
  );
}