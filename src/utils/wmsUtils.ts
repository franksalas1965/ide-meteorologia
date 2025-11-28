import { WMSLayerBounds } from "@/types/map-types";
import { resolveProxyUrl } from "../config/proxyResolver";



export async function getWMSLayerBounds(
  wmsUrl: string,
  layerName: string,
  onProgress?: (message: string) => void
): Promise<WMSLayerBounds> {
  try {
    const resolvedUrl = await resolveProxyUrl(wmsUrl);
    const response = await fetch(
      `${resolvedUrl}?service=WMS&version=1.3.0&request=GetCapabilities`
    );

    onProgress?.("Obteniendo capacidades del WMS...");

    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    // Verificar errores en el XML
    const parserErrors = xmlDoc.getElementsByTagName("parsererror");
    if (parserErrors.length > 0) {
      throw new Error("Invalid XML response from WMS server");
    }

    const layers = xmlDoc.getElementsByTagName("Layer");
    let targetLayer: Element | null = null;
    const fallbackLayerName = layerName.includes(":")
      ? layerName.split(":")[1]
      : null;

    // Buscar la capa
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const nameElement = layer.getElementsByTagName("Name")[0];
      if (nameElement) {
        const currentLayerName = nameElement.textContent || "";
        if (
          currentLayerName === layerName ||
          (fallbackLayerName && currentLayerName === fallbackLayerName)
        ) {
          targetLayer = layer;
          break;
        }
      }
    }

    if (!targetLayer) {
      throw new Error(`Layer ${layerName} not found`);
    }

    // Función para buscar bounds recursivamente (devuelve objeto simple)
    const findBoundsInLayerHierarchy = (layer: Element): WMSLayerBounds => {
      // Buscar EX_GeographicBoundingBox
      const exGeographicBoundingBox = layer.getElementsByTagName(
        "EX_GeographicBoundingBox"
      )[0];
      if (exGeographicBoundingBox) {
        return {
          west: parseFloat(
            exGeographicBoundingBox.getElementsByTagName(
              "westBoundLongitude"
            )[0]?.textContent || "0"
          ),
          east: parseFloat(
            exGeographicBoundingBox.getElementsByTagName(
              "eastBoundLongitude"
            )[0]?.textContent || "0"
          ),
          south: parseFloat(
            exGeographicBoundingBox.getElementsByTagName(
              "southBoundLatitude"
            )[0]?.textContent || "0"
          ),
          north: parseFloat(
            exGeographicBoundingBox.getElementsByTagName(
              "northBoundLatitude"
            )[0]?.textContent || "0"
          ),
        };
      }

      // Buscar BoundingBox en CRS 4326
      const boundingBoxes = layer.getElementsByTagName("BoundingBox");
      for (let i = 0; i < boundingBoxes.length; i++) {
        const bbox = boundingBoxes[i];
        const crs = bbox.getAttribute("CRS") || bbox.getAttribute("crs");
        if (crs === "EPSG:4326") {
          return {
            west: parseFloat(bbox.getAttribute("minx") || "0"),
            east: parseFloat(bbox.getAttribute("maxx") || "0"),
            south: parseFloat(bbox.getAttribute("miny") || "0"),
            north: parseFloat(bbox.getAttribute("maxy") || "0"),
          };
        }
      }

      // Buscar en la jerarquía padre
      const parentLayer = layer.parentElement?.closest("Layer");
      if (parentLayer) {
        return findBoundsInLayerHierarchy(parentLayer);
      }

      // Bounds por defecto (Cuba aproximada)
      return {
        south: 19.82,
        west: -84.95,
        north: 23.27,
        east: -74.13,
      };
    };

    return findBoundsInLayerHierarchy(targetLayer);
  } catch (error) {
    console.error("Error in getWMSLayerBounds:", error);
    // Devuelve bounds por defecto en caso de error
    return {
      south: 19.82,
      west: -84.95,
      north: 23.27,
      east: -74.13,
    };
  }
}

// Función opcional para convertir a Leaflet (solo en cliente)
export async function convertToLeafletBounds(bounds: WMSLayerBounds) {
  if (typeof window !== "undefined") {
    const L = await import("leaflet");
    return L.latLngBounds(
      L.latLng(bounds.south, bounds.west),
      L.latLng(bounds.north, bounds.east)
    );
  }
  return null;
}
