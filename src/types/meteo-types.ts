// types/meteo-types.ts
import L from "leaflet";

export interface MeteoLayerConfig {
  id: string;
  name: string;
  type: "tile" | "wms";
  url: string;
  layerKey: string;
  zIndex: number;
  opacity: number;
  apiKey?: string;
}

export interface MeteoLayerDefinition {
  name: string;
  layerKey: string;
  zIndex: number;
  opacity: number;
}

export interface MeteoServiceConfig {
  name: string;
  type: "tile" | "wms";
  url: string;
  layers: {
    [key: string]: MeteoLayerDefinition;
  };
}

export interface MeteoConfig {
  meteoServices: {
    [key: string]: MeteoServiceConfig;
  };
  apiKeys: {
    [key: string]: string;
  };
}

export interface ActiveMeteoLayer {
  serviceId: string;
  layerId: string;
  layer: L.Layer;
  config: MeteoLayerConfig;
}

export interface ActiveMeteoLayerRequest {
  serviceId: string;
  layerId: string;
}

// Tipos para la información de features
export interface FeatureInfoResult {
  layerName: string;
  layerConfig: any;
  data: string;
  latlng: {
    lat: number;
    lng: number;
  };
}
