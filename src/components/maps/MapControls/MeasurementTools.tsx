// MeasurementTools.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-measure/dist/leaflet-measure.css";
import "../../../styles/Leaflets.module.css";

interface MeasurementToolsProps {
  map: L.Map | null;
  active: boolean;
  mode: "line" | "area";
  costAboveGround?: number;
  costUnderground?: number;
  unitSystem?: "metric" | "imperial";
  onMeasurementComplete?: (result: MeasurementResult) => void;
}

interface MeasurementResult {
  type: "line" | "area";
  value: number;
  unit: string;
  points: L.LatLng[];
  costAboveGround?: number;
  costUnderground?: number;
}

export const MeasurementTools = ({
  map,
  active,
  mode,
  costAboveGround = 17.89,
  costUnderground = 12.55,
  unitSystem = "metric",
  onMeasurementComplete,
}: MeasurementToolsProps) => {
  const measurementControl = useRef<any>(null);
  const isActiveRef = useRef(false);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const vertexMarkersRef = useRef<L.Marker[]>([]);
  const distanceLabelsRef = useRef<L.Popup[]>([]);
  const areaLabelRef = useRef<L.Popup | null>(null);

  const currentMeasurement = useRef<{
    type: "line" | "area";
    layer: L.Layer | null;
    points: L.LatLng[];
  } | null>(null);

  // Limpiar mediciones anteriores
  const cleanupMeasurement = () => {
    if (currentMeasurement.current?.layer && map) {
      map.removeLayer(currentMeasurement.current.layer);
    }
    markersRef.current.forEach(marker => map?.removeLayer(marker));
    vertexMarkersRef.current.forEach(marker => map?.removeLayer(marker));
    distanceLabelsRef.current.forEach(label => map?.removeLayer(label));
    if (areaLabelRef.current) map?.removeLayer(areaLabelRef.current);
    markersRef.current = [];
    vertexMarkersRef.current = [];
    distanceLabelsRef.current = [];
    areaLabelRef.current = null;
    currentMeasurement.current = null;
  };

  // Calcular distancia o área
  const calculateMeasurement = (points: L.LatLng[]) => {
    if (mode === "line") {
      let distance = 0;
      const segmentDistances: number[] = [];
      for (let i = 1; i < points.length; i++) {
        const segmentDistance = points[i - 1].distanceTo(points[i]);
        segmentDistances.push(segmentDistance);
        distance += segmentDistance;
      }

      if (unitSystem === "imperial") {
        return { 
          value: distance * 3.28084, 
          unit: "ft",
          segmentDistances: segmentDistances.map(d => d * 3.28084) 
        };
      }
      return { 
        value: distance, 
        unit: "m",
        segmentDistances 
      };
    } else {
      if (points.length < 3) return { value: 0, unit: "m²" };
      
      let area = 0;
      const n = points.length;
      
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const xi = points[i].lng * (Math.PI / 180);
        const xj = points[j].lng * (Math.PI / 180);
        const yi = points[i].lat * (Math.PI / 180);
        const yj = points[j].lat * (Math.PI / 180);
        
        area += xi * yj;
        area -= xj * yi;
      }
      
      area = Math.abs(area) / 2;
      const R = 6378137;
      const areaM2 = area * R * R;
      
      if (unitSystem === "imperial") {
        return { 
          value: areaM2 * 10.7639, 
          unit: "ft²",
          valueM2: areaM2
        };
      }
      return { 
        value: areaM2, 
        unit: "m²",
        valueHa: areaM2 / 10000,
        valueKm2: areaM2 / 1000000
      };
    }
  };

  // Mostrar popup con resultados
  const showMeasurementPopup = (
    measurement: {
      value: number;
      unit: string;
      segmentDistances?: number[];
      valueHa?: number;
      valueKm2?: number;
      valueM2?: number;
    },
    points: L.LatLng[]
  ) => {
    let costAbove = "";
    let costUnder = "";
    if (!map || !currentMeasurement.current?.layer) return;

    let content = "";
    const formattedValue = measurement.value.toFixed(2);

    if (mode === "line") {
      costAbove = (costAboveGround * measurement.value).toFixed(2);
      costUnder = (costUnderground * measurement.value).toFixed(2);

      let segmentsContent = "";
      if (measurement.segmentDistances) {
        segmentsContent = measurement.segmentDistances.map((dist, i) => `
          <div class="segment-distance">
            Segmento ${i + 1}: ${dist.toFixed(2)} ${measurement.unit}
          </div>
        `).join("");
      }

      content = `
        <div class="measurement-result">
          <h4>Resultado Distancia</h4>
          <p>Distancia total: ${formattedValue} ${measurement.unit}</p>
          ${segmentsContent}
          <p>Costo sobre tierra: $${costAbove}</p>
          <p>Costo subterráneo: $${costUnder}</p>
        </div>
      `;
    } else {
      const areaValue = unitSystem === "imperial" ? measurement.valueM2! : measurement.value;
      const areaUnit = unitSystem === "imperial" ? "m²" : measurement.unit;
      const formattedArea = areaValue.toFixed(2);

      const formattedHa = measurement.valueHa?.toLocaleString(undefined, {
        maximumFractionDigits: 2,
      });
      const formattedKm2 = measurement.valueKm2?.toLocaleString(undefined, {
        maximumFractionDigits: 4,
      });

      content = `
        <div class="measurement-result">
          <h4>Medición de Área</h4>
          <p>Área: ${formattedArea} ${areaUnit}</p>
          ${unitSystem === "metric" ? `
            <p>${formattedHa} hectáreas</p>
            <p>${formattedKm2} km²</p>
          ` : ''}
        </div>
      `;
    }

    const lastPoint = points[points.length - 1];
    L.popup().setLatLng(lastPoint).setContent(content).openOn(map);

    if (onMeasurementComplete) {
      onMeasurementComplete({
        type: mode,
        value: measurement.value,
        unit: measurement.unit,
        points,
        costAboveGround: mode === "line" ? parseFloat(costAbove) : undefined,
        costUnderground: mode === "line" ? parseFloat(costUnder) : undefined,
      });
    }
  };

  // Actualizar etiqueta de área
  const updateAreaLabel = (points: L.LatLng[]) => {
    if (!map || mode !== "area" || points.length < 3) return;

    const result = calculateMeasurement(points);
    const center = getPolygonCenter(points);

    if (areaLabelRef.current) {
      map.removeLayer(areaLabelRef.current);
    }

    const areaValue = unitSystem === "imperial" ? result.valueM2! : result.value;
    const areaUnit = unitSystem === "imperial" ? "m²" : result.unit;
    const formattedArea = areaValue.toFixed(2);

    areaLabelRef.current = L.popup({
      autoClose: false,
      closeOnClick: false,
      className: 'area-label-popup'
    })
    .setLatLng(center)
    .setContent(`<div class="area-label">Área: ${formattedArea} ${areaUnit}</div>`)
    .addTo(map);
  };

  // Calcular centro de polígono
  const getPolygonCenter = (points: L.LatLng[]) => {
    let x = 0, y = 0, z = 0;
    points.forEach(point => {
      const lat = point.lat * Math.PI / 180;
      const lng = point.lng * Math.PI / 180;
      x += Math.cos(lat) * Math.cos(lng);
      y += Math.cos(lat) * Math.sin(lng);
      z += Math.sin(lat);
    });
    x /= points.length;
    y /= points.length;
    z /= points.length;

    const centerLng = Math.atan2(y, x);
    const centerLat = Math.atan2(z, Math.sqrt(x * x + y * y));

    return L.latLng(
      centerLat * 180 / Math.PI,
      centerLng * 180 / Math.PI
    );
  };

  // Crear marcador de vértice con número
  const createVertexMarker = (latlng: L.LatLng, index: number) => {
    if (!map) return null;

    const icon = L.divIcon({
      html: `<div class="vertex-number">${index + 1}</div>`,
      className: 'vertex-number-icon',
      iconSize: [18, 18]
    });

    const marker = L.marker(latlng, {
      icon: icon,
      interactive: false
    }).addTo(map);

    return marker;
  };

  // Crear marcador para punto de medición
  const createPointMarker = (latlng: L.LatLng) => {
    if (!map) return null;

    const marker = L.circleMarker(latlng, {
      radius: 3,
      fillColor: "#3388ff",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(map);

    return marker;
  };

  // Crear etiqueta de distancia entre puntos
  const createDistanceLabel = (start: L.LatLng, end: L.LatLng, index: number, totalDistance: number) => {
    if (!map) return null;

    const midpoint = L.latLng(
      (start.lat + end.lat) / 2,
      (start.lng + end.lng) / 2
    );

    const distance = start.distanceTo(end);
    const accumulated = totalDistance;
    
    const formattedDistance = unitSystem === "imperial" 
      ? `${(distance * 3.28084).toFixed(2)} ft` 
      : `${distance.toFixed(2)} m`;
    
    const formattedAccumulated = unitSystem === "imperial"
      ? `${(accumulated * 3.28084).toFixed(2)} ft`
      : `${accumulated.toFixed(2)} m`;

    const popup = L.popup({
      autoClose: false,
      closeOnClick: false,
      className: 'distance-label-popup'
    })
    .setLatLng(midpoint)
    .setContent(`
      <div class="distance-label">
        <div>Segmento: ${formattedDistance}</div>
        <div>Acumulado: ${formattedAccumulated}</div>
      </div>
    `)
    .addTo(map);

    return popup;
  };

  // Actualizar marcadores y etiquetas
  const updateMarkersAndLabels = (points: L.LatLng[]) => {
    // Limpiar marcadores y etiquetas anteriores
    markersRef.current.forEach(marker => map?.removeLayer(marker));
    vertexMarkersRef.current.forEach(marker => map?.removeLayer(marker));
    distanceLabelsRef.current.forEach(label => map?.removeLayer(label));
    markersRef.current = [];
    vertexMarkersRef.current = [];
    distanceLabelsRef.current = [];

    // Crear nuevos marcadores
    points.forEach((point, index) => {
      const marker = createPointMarker(point);
      const vertexMarker = createVertexMarker(point, index);
      if (marker) markersRef.current.push(marker);
      if (vertexMarker) vertexMarkersRef.current.push(vertexMarker);
    });

    // Crear etiquetas de distancia (solo para modo línea)
    if (mode === "line" && points.length > 1) {
      let totalDistance = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const segmentDistance = points[i].distanceTo(points[i + 1]);
        totalDistance += segmentDistance;
        const label = createDistanceLabel(points[i], points[i + 1], i, totalDistance);
        if (label) distanceLabelsRef.current.push(label);
      }
    }

    // Actualizar etiqueta de área (solo para modo área)
    if (mode === "area") {
      updateAreaLabel(points);
    }
  };

  // Configurar eventos del mapa
  const setupMapEvents = () => {
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (!currentMeasurement.current) {
        // Iniciar nueva medición
        currentMeasurement.current = {
          type: mode,
          layer: null,
          points: [e.latlng],
        };

        if (mode === "line") {
          currentMeasurement.current.layer = L.polyline([e.latlng, e.latlng], {
            color: "#15D30EFF",
            weight: 3,
          }).addTo(map);
        } else {
          currentMeasurement.current.layer = L.polygon(
            [e.latlng, e.latlng, e.latlng],
            {
              color: "#11E08AFF",
              weight: 3,
              fillOpacity: 0.3,
            }
          ).addTo(map);
        }

        // Agregar primer marcador y número de vértice
        const marker = createPointMarker(e.latlng);
        const vertexMarker = createVertexMarker(e.latlng, 0);
        if (marker) markersRef.current.push(marker);
        if (vertexMarker) vertexMarkersRef.current.push(vertexMarker);
      } else {
        // Agregar punto a la medición existente
        currentMeasurement.current.points.push(e.latlng);
        updateMeasurementLayer();
        updateMarkersAndLabels(currentMeasurement.current.points);
      }
    };

    const handleMove = (e: L.LeafletMouseEvent) => {
      if (
        currentMeasurement.current &&
        currentMeasurement.current.points.length > 0
      ) {
        const tempPoints = [...currentMeasurement.current.points, e.latlng];
        updateMeasurementLayer(tempPoints);
        if (mode === "area") {
          updateAreaLabel([...currentMeasurement.current.points, e.latlng]);
        }
      }
    };

    const handleDoubleClick = () => {
      if (
        currentMeasurement.current &&
        currentMeasurement.current.points.length > 1
      ) {
        const result = calculateMeasurement(currentMeasurement.current.points);
        showMeasurementPopup(result, currentMeasurement.current.points);
        cleanupMeasurement();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        cleanupMeasurement();
      }
    };

    map.on("click", handleClick);
    map.on("mousemove", handleMove);
    map.on("dblclick", handleDoubleClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      map.off("click", handleClick);
      map.off("mousemove", handleMove);
      map.off("dblclick", handleDoubleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  };

  // Actualizar capa de medición
  const updateMeasurementLayer = (tempPoints?: L.LatLng[]) => {
    if (!currentMeasurement.current?.layer || !map) return;

    const points = tempPoints || currentMeasurement.current.points;

    if (currentMeasurement.current.type === "line") {
      (currentMeasurement.current.layer as L.Polyline).setLatLngs(points);
    } else {
      if (points.length >= 3) {
        (currentMeasurement.current.layer as L.Polygon).setLatLngs([points]);
      }
    }
  };

  useEffect(() => {
    if (!map) return;

    if (active) {
      const cleanupEvents = setupMapEvents();
      map.dragging.disable();
      map.doubleClickZoom.disable();

      return () => {
        cleanupMeasurement();
        if (cleanupEvents) cleanupEvents();
        map.dragging.enable();
        map.doubleClickZoom.enable();
      };
    } else {
      cleanupMeasurement();
      map.dragging.enable();
      map.doubleClickZoom.enable();
    }
  }, [map, active, mode, unitSystem]);

  return null;
};