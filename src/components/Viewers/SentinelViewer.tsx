/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useMemo } from "react";
import { Box, Typography, Slider, Button, Chip, Stack } from "@mui/material";
//import { MapContainer } from "../maps/MapContainer";
import { WMSTileLayer } from "react-leaflet";

interface WMSLayer {
  url: string;
  layers: string;
  layerId: string;
  workspace?: string;
}

export default function SentinelViewer() {
  const [zoom, setZoom] = useState<number>(8);
  const [center] = useState<[number, number]>([22.977093065, -82.1705474125]);
  const [dateRange, setDateRange] = useState<[number, number]>([2020, 2023]);
  const [selectedLayers, setSelectedLayers] = useState<string[]>(["sentinel"]);

  // Capas WMS disponibles
  const availableLayers = [
    {
      id: "sentinel",
      name: "Sentinel-2",
      url: "https://example.com/wms",
      layers: "sentinel2",
    },
    {
      id: "ndvi",
      name: "NDVI",
      url: "https://example.com/wms",
      layers: "ndvi",
    },
    { id: "rgb", name: "RGB", url: "https://example.com/wms", layers: "rgb" },
  ];

  const activeWMSLayers = useMemo(() => {
    return availableLayers
      .filter((layer) => selectedLayers.includes(layer.id))
      .map((layer) => ({
        url: layer.url,
        layers: layer.layers,
        layerId: layer.id,
      }));
  }, [selectedLayers]);

 

  return (
    <Box sx={{ width: "100%", height: "100%", p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Visor Sentinel-2
      </Typography>

      <Box sx={{ display: "flex", gap: 2, height: "80%" }}>
        {/* Mapa */}
        <Box sx={{ flex: 3, borderRadius: 1, overflow: "hidden" }}>
          {/* <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            {activeWMSLayers.map((layer) => (
              <WMSTileLayer
                key={layer.layerId}
                url={layer.url}
                layers={layer.layers}
                transparent={true}
                format="image/png"
              />
            ))}
          </MapContainer> */}
        </Box>

        {/* Controles (se mantiene igual) */}
        {/* ... */}
      </Box>
    </Box>
  );
}
