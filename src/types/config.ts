// types/config.ts
export interface AppConfig {
  menuUrl: string;
  baseLayersUrl: string;
  appTitle: string;
  appVersion: string;
  defaultCenter: [number, number];
  defaultZoom: number;
  cacheTimeout: number;
  features: {
    search: boolean;
    infoMode: boolean;
    layerZoom: boolean;
    dynamicArea: boolean;
  };
}

// Extender la interfaz Window para incluir APP_CONFIG
declare global {
  interface Window {
    APP_CONFIG: AppConfig;
  }
}
