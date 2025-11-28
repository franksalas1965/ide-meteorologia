// types/geospatial.d.ts
import type { Feature, FeatureCollection, Geometry } from "@turf/turf";

export interface BridgeProperties {
  id: string;
  capacidad: number;
  // otras propiedades
}

export type BridgeFeature = Feature<Geometry, BridgeProperties>;
export type BridgeFeatureCollection = FeatureCollection<
  Geometry,
  BridgeProperties
>;
