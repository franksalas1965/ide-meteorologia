import type { LatLngExpression } from "leaflet";

interface MapInitializerOptions {
  container: HTMLElement;
  center: LatLngExpression;
  zoom: number;
  onInit: (map: L.Map) => void;
}

interface BaseLayerConfig {
  id: string;
  name: string;
  url: string;
  attribution: string;
  thumbnail: string;
}

interface MapInitializationResult {
  map: L.Map | null;
  cleanup: () => void;
}

export const initializeMap = async ({
  container,
  center,
  zoom,
  onInit,
}: MapInitializerOptions): Promise<MapInitializationResult> => {
  // Early return if running on server-side
  if (typeof window === "undefined" || !container) {
    return { map: null, cleanup: () => {} };
  }

  try {
    // Dynamically import Leaflet and plugins on client-side only
    const L = await import("leaflet");

    // Clean up existing map if present
    const existingMap = (container as any)._leaflet_map as L.Map | undefined;
    if (existingMap) {
      existingMap.off();
      existingMap.remove();
    }

    // Configure default icons
    configureLeafletIcons(L);

    // Create new map instance
    const map = createMapInstance(L, container, center, zoom);
    setupMapEvents(map, container);

    // Apply base layers
    await applyBaseLayers(L, map);

    // Initialize map controls and call callback
    onInit(map);

    return {
      map,
      cleanup: () => cleanupMap(map, container),
    };
  } catch (error) {
    console.error("Map initialization failed:", error);
    return { map: null, cleanup: () => {} };
  }
};

// Helper functions
function configureLeafletIcons(L: typeof import("leaflet")) {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/images/marker-icon-2x.png",
    iconUrl: "/images/marker-icon.png",
    shadowUrl: "/images/marker-shadow.png",
  });
}

function createMapInstance(
  L: typeof import("leaflet"),
  container: HTMLElement,
  center: LatLngExpression,
  zoom: number
): L.Map {
  return L.map(container, {
    center,
    zoom,
    zoomControl: false,
    attributionControl: false,
    dragging: true,
  });
}

function setupMapEvents(map: L.Map, container: HTMLElement) {
  container.style.cursor = "grab";
  map
    .on("dragstart", () => (container.style.cursor = "grabbing"))
    .on("dragend", () => (container.style.cursor = "grab"));
}

async function applyBaseLayers(
  L: typeof import("leaflet"),
  map: L.Map
): Promise<void> {
  try {
    const configUrl = process.env.NEXT_PUBLIC_CONFIG_URL || "/config";
    const response = await fetch(`${configUrl}/baseLayers.json`);
    const baseLayers: BaseLayerConfig[] = await response.json();

    if (baseLayers.length > 0) {
      const defaultLayer = baseLayers[0];
      L.tileLayer(defaultLayer.url, {
        attribution: defaultLayer.attribution,
        maxZoom: 19,
      }).addTo(map);

      (map as any).baseLayers = baseLayers;
    } else {
      throw new Error("No base layers found in config");
    }
  } catch (error) {
    console.error("Error loading base layers, using fallback:", error);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
  }
}

function cleanupMap(map: L.Map | null, container: HTMLElement) {
  if (map && (container as any)._leaflet_map === map) {
    map.off();
    map.remove();
  }
}
