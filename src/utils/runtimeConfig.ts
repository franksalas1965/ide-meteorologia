// utils/runtimeConfig.ts
import { AppConfig } from "@/types/config";

const defaultConfig: AppConfig = {
  menuUrl: "/config/menu.json",
  baseLayersUrl: "/config/baseLayers.json",
  appTitle: "Servicio de Mapas",
  appVersion: "1.0.0",
  defaultCenter: [22.977093065, -82.1705474125],
  defaultZoom: 6,
  cacheTimeout: 300000,
  features: {
    search: true,
    infoMode: true,
    layerZoom: true,
    dynamicArea: true,
  },
};

export const getRuntimeConfig = (): AppConfig => {
  if (typeof window !== "undefined") {
    // Combinar configuración por defecto con la configuración de window
    return {
      ...defaultConfig,
      ...(window.APP_CONFIG || {}),
    };
  }

  // Para SSR (si lo usas)
  return defaultConfig;
};
