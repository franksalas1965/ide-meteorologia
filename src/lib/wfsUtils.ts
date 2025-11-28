// src/lib/wfsUtils.ts
import { resolveProxyUrl } from "../config/proxyResolver";

export async function buildWFSUrl(
  wmsUrl: string,
  layerName: string,
  version: string = "1.3.0",
  workspace?: string
): Promise<string> {
  // 1. Resolver la URL base con el proxy
  const resolvedUrl = await resolveProxyUrl(wmsUrl);

  // 2. Convertir de WMS a WFS correctamente
  const wfsBaseUrl = resolvedUrl
    .replace("/wms", "/ows")
    .replace("/geoserver/wms", "/geoserver/ows");

  // 3. Construir parámetros WFS correctos
  const params = new URLSearchParams({
    service: "WFS",
    version: version === "1.3.0" ? "1.0.0" : "2.0.0", // WFS 1.0.0 para WMS 1.3.0
    request: "GetFeature",
    typeName: layerName,
    outputFormat: "application/json",
    count: "1",
  });

  if (workspace) {
    params.set("namespace", workspace);
  }

  // 4. Construir URL final
  return `${wfsBaseUrl}?${params.toString()}`;
}
