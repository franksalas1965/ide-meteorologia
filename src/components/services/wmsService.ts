// services/wmsService.ts

// Cache para la configuración del proxy
let cachedProxyConfig: any = null;

async function loadProxyConfig() {
  if (!cachedProxyConfig) {
    const configUrl = process.env.NEXT_PUBLIC_CONFIG_URL || "/config";
    const response = await fetch(`${configUrl}/proxyConfig.json`);
    if (!response.ok) throw new Error("Failed to load proxy config");
    cachedProxyConfig = await response.json();
  }
  return cachedProxyConfig;
}

// Función auxiliar para aplicar el prefijo del proxy
const applyProxyPrefix = async (originalUrl: string): Promise<string> => {
  const proxyConfig = await loadProxyConfig();

  const proxy = proxyConfig.proxies.find((p: any) =>
    originalUrl.includes(p.target.replace(/https?:\/\//, ""))
  );

  if (proxy) {
    // Si la URL es el target, reemplazar con el prefijo
    if (originalUrl.startsWith(proxy.target)) {
      return originalUrl.replace(proxy.target, proxy.prefix);
    }
    // Si ya tiene el prefijo, dejarla igual
    if (originalUrl.startsWith(proxy.prefix)) {
      return originalUrl;
    }
  }

  return originalUrl;
};

export const fetchWMSFields = async (layerConfig: {
  url: string;
  layers: string;
  version?: string;
  workspace?: string;
}) => {
  try {
    // 1. Aplicar proxy primero
    const proxiedUrl = await applyProxyPrefix(layerConfig.url);

    // Resto del código permanece igual...
    const serviceUrl = proxiedUrl
      .replace("/wms", "/ows")
      .replace("/geoserver/wms", "/geoserver/ows");

    const params = new URLSearchParams({
      service: "WFS",
      version: layerConfig.version === "1.3.0" ? "1.0.0" : "2.0.0",
      request: "GetFeature",
      typeName: layerConfig.layers,
      outputFormat: "application/json",
      count: "1",
    });

    if (layerConfig.workspace) {
      params.set("namespace", layerConfig.workspace);
    }

    const finalUrl = `${serviceUrl}?${params.toString()}`;
    const response = await fetch(finalUrl);

    if (!response.ok) {
      throw new Error(`WFS Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features?.[0]?.properties
      ? Object.keys(data.features[0].properties)
      : [];
  } catch (error) {
    console.error("Error in fetchWMSFields:", error);
    throw error;
  }
};

export const fetchWFSValues = async (
  layerConfig: {
    url: string;
    layers: string;
    version?: string;
    workspace?: string;
  },
  field: string,
  limit: number = 10
) => {
  try {
    // 1. Aplicar proxy (convertir https://... a /proxy/geocuba/...)
    const baseUrl = await applyProxyPrefix(layerConfig.url);

    // Resto del código permanece igual...
    const serviceUrl = baseUrl
      .replace("/wms", "/ows")
      .replace("/geoserver/wms", "/geoserver/ows");

    const params = new URLSearchParams({
      service: "WFS",
      version: layerConfig.version === "1.3.0" ? "1.0.0" : "2.0.0",
      request: "GetFeature",
      typeName: layerConfig.layers,
      outputFormat: "application/json",
      propertyName: field,
      count: limit.toString(),
    });

    if (layerConfig.workspace) {
      params.set("namespace", layerConfig.workspace);
    }

    const finalUrl = `${serviceUrl}?${params.toString()}`;
    const response = await fetch(finalUrl);

    if (!response.ok) {
      throw new Error(`WFS Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.features?.map((f: any) => String(f.properties[field])) || [];
  } catch (error) {
    console.error("Error in fetchWFSValues:", error);
    throw error;
  }
};
