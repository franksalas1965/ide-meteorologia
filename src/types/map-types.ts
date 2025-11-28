import { LatLngExpression } from "leaflet";
import { ReactNode, CSSProperties } from "react";

export interface WMSLayer {
  layerId: string;
  name: string;
  url: string;
  crs?: string | number;
  layers: string;
  format?: string;
  version?: string;
  transparent?: boolean;
  opacity?: number;
  zIndex?: number;
  styles?: string;
  attribution?: string;
  style?: React.CSSProperties;
  className?: string;
  visible?: boolean;
  minZoom?: number;
  maxZoom?: number;
  description?: string;
  category?: string;
  source?: string;
  timestamp?: string;
  uppercase?: boolean;
  workspace?: string;
  extent?: [number, number, number, number];
  bounds?: L.LatLngBoundsExpression;
  id: string; 
  layer: L.Layer; 
  type: "base" | "overlay";
}

export interface LayerState {
  [key: string]: {
    isActive: boolean;
    config?: WMSLayer;
  };
}

export interface ActivateLayerComponentProps {
  activeLayers: WMSLayer[];
  isDrawerOpen: boolean;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  infoMode?: boolean;
  activeInfoLayer?: WMSLayer | null;
  onLayerToggle?: (layerId: string, isActive: boolean) => void;
  onError?: (message: string) => void;
  onMapInit?: (map: L.Map) => void;
}

export interface MapContainerProps {
  center: L.LatLngExpression;
  zoom: number;
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  whenReady?: (map: L.Map) => void;
  zoomControl?: boolean;
  scrollWheelZoom?: boolean;
  attributionControl?: boolean;
  minZoom?: number;
  maxZoom?: number;
  maxBounds?: L.LatLngBounds;
  crs?: L.CRS;
}

export interface MapContextType {
  containerRef: React.RefObject<HTMLDivElement>;
  initializeMap: (options: {
    center: L.LatLngExpression;
    zoom: number;
    zoomControl?: boolean;
    scrollWheelZoom?: boolean;

    attributionControl?: boolean;
    minZoom?: number;
    maxZoom?: number;
    maxBounds?: L.LatLngBounds;
    crs?: L.CRS;
  }) => L.Map | null;
  getMap: () => L.Map | null;
}

export interface MarkerProps {
  position: L.LatLngExpression;
  icon?: L.Icon | L.DivIcon;
  draggable?: boolean;
  title?: string;
  alt?: string;
  onClick?: (e: L.LeafletMouseEvent) => void;
  children?: ReactNode;
}

export type MapLayerControlLayer = WMSLayer & {
  id: string;
  layer: L.Layer;
  visible: boolean;
  type: "base" | "overlay";
};

export interface WMSLayerBase {
  layerId: string;
  name: string;
  url: string;
  layers: string;
  visible?: boolean;
  type?: "base" | "overlay";
  // ... otras propiedades WMS que necesites
}



// Asegúrate que orderedLayers use este tipo
export type OrderedLayersType = MapLayerControlLayer[];

export interface LayerControlProps {
  map: L.Map,
  layers: Array<{
    id: string;
    name: string;
    layers: MapLayerControlLayer[];
    active?: boolean;
    icon?: ReactNode;
    onLayersChange: (newLayers: MapLayerControlLayer[]) => void;
    showCloseButton?: boolean;
    onClose?: () => void;
  }>;
  position?: "topright" | "topleft" | "bottomright" | "bottomleft";
  onLayerToggle?: (layerId: string, active: boolean) => void;
}

export interface PopupProps {
  content?: string | ReactNode;
  offset?: L.PointExpression;
  maxWidth?: number;
  minWidth?: number;
  maxHeight?: number;
  autoPan?: boolean;
  autoPanPaddingTopLeft?: L.PointExpression;
  autoPanPaddingBottomRight?: L.PointExpression;
  autoPanPadding?: L.PointExpression;
  keepInView?: boolean;
  closeButton?: boolean;
  autoClose?: boolean;
  closeOnEscapeKey?: boolean;
  closeOnClick?: boolean;
  className?: string;
}

export interface MapLayer {
  layer: L.Layer;
  name: string;
  type: "WMS" | "WFS";
  crs?: number;

  options: {
    url: string;
    layers?: string;
    version?: string;
    workspace?: string;
    [key: string]: any;
  };
}

// Tipo para los bounds sin depender de Leaflet
export interface WMSLayerBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}