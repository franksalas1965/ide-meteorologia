import L from "leaflet";

export interface WMSLayer {
  layerId: string;
  layers: string;
  url?: string;
  format?: string;
  transparent?: boolean;
  version?: string;
  opacity?: number;
  uppercase?: boolean;
  styles?: string;
  attribution?: string;
  crs?: string | number;
}

