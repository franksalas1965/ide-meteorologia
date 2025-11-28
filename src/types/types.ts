
import { MenuAction } from "./menu";

export interface DashboardAction {
  actionType: string;
  payload?: {
    layerConfig?: {
      layerId: string;
      url: string;
      layers: string;
      version?: string;
      format?: string;
      transparent?: boolean;
      opacity?: number;
      uppercase?: boolean;
      zIndex?: number;
      zoommin?: number;
      zoommax?: number;
    };
    imageId?: string;
    chartType?: string;
    [key: string]: any; // Para propiedades adicionales
  };
  // Campos directos para fácil acceso
  layerConfig?: MenuAction["layerConfig"];
  imageId?: string;
  chartType?: string;
  layers?: any[];
}



export type DynamicComponentType =
  | "activateLayer"
  | "loadImageSentinel"
  | "loadImage"
  | "reports"
  | "charts";


 