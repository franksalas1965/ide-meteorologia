// utils/geoOperations.ts
import * as turf from "@turf/turf";

export const findIntersections = (
  layer1: GeoJSON.FeatureCollection,
  layer2: GeoJSON.FeatureCollection
) => {
  const results: GeoJSON.Feature[] = [];

  layer1.features.forEach((feature1) => {
    layer2.features.forEach((feature2) => {
      if (turf.booleanIntersects(feature1, feature2)) {
        // Combina propiedades de ambos features
        const combinedProperties = {
          ...feature1.properties,
          ...feature2.properties,
        };

        results.push({
          ...feature1,
          properties: combinedProperties,
        });
      }
    });
  });

  return turf.featureCollection(results);
};
