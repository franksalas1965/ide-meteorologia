// src/lib/wmsUtils.ts
export const fetchWMSFields = async (layerConfig: {
  url: string;
  layers: string;
  version?: string;
  workspace?: string;
}) => {
  try {
    // Determina si debemos usar proxy (para URLs externas)
    const useProxy =
      !layerConfig.url.startsWith(window.location.origin) &&
      !layerConfig.url.startsWith("/");

    const baseUrl = useProxy
      ? `/api/proxy/${encodeURIComponent(layerConfig.url)}`
      : layerConfig.url;

    const params = new URLSearchParams({
      service: "WMS",
      request: "DescribeLayer",
      version: layerConfig.version || "1.3.0",
      layers: layerConfig.layers,
      outputFormat: "application/json",
      ...(layerConfig.workspace && { workspace: layerConfig.workspace }),
    });

    const url = `${baseUrl}?${params.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error en la respuesta WMS: ${response.statusText}`);
    }

    const data = await response.json();
    return data.fields || [];
  } catch (error) {
    console.error("Error en fetchWMSFields:", error);
    throw error;
  }
};
