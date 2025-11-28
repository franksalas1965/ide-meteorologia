// public/config.js
window.APP_CONFIG = {
  // URLs de configuración
  menuUrl: "/config/menu.json",
  baseLayersUrl: "/config/baseLayers.json",

  // Configuración de la aplicación
  appTitle: "IDE-METEOROLOGIA",
  appVersion: "1.0.0",

  // Configuración del mapa
  defaultCenter: [22.977093065, -82.1705474125],
  defaultZoom: 6,

  // Tiempos de cache (en milisegundos)
  cacheTimeout: 300000, // 5 minutos

  // Feature flags
  features: {
    search: true,
    infoMode: true,
    layerZoom: true,
    dynamicArea: true,
  },
};
