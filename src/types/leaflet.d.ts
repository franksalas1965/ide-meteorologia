//types/leaflet.d.ts

import "leaflet";
import "leaflet-measure";


declare global {
  interface HTMLElement {
    _leaflet_map?: L.Map | undefined;
  }
}

declare module "leaflet" {
  namespace Control {
    // Mantén tu declaración existente para LinearMeasurement
    interface LinearMeasurementOptions extends ControlOptions {
      unitSystem?: "metric" | "imperial";
      color?: string;
      show_azimut?: boolean;
      className?: string;
    }

    class LinearMeasurement extends Control {
      constructor(options?: LinearMeasurementOptions);
      addTo(map: Map): this;
      _measuring: "distance" | "area";
      _toggleMeasure(): void;
      layerSelected?(e: any): void;
    }

    // Añade las nuevas declaraciones para leaflet-measure
    interface MeasureOptions extends ControlOptions {
      position?: ControlPosition;
      primaryLengthUnit?:
        | "meters"
        | "kilometers"
        | "feet"
        | "miles"
        | "nauticalMiles";
      secondaryLengthUnit?:
        | "meters"
        | "kilometers"
        | "feet"
        | "miles"
        | "nauticalMiles"
        | undefined;
      primaryAreaUnit?: "acres" | "hectares" | "sqmeters" | "sqmiles";
      activeColor?: string;
      completedColor?: string;
      captureZIndex?: number;
      decPoint?: string;
      thousandsSep?: string;
    }

    class Measure extends Control {
      constructor(options?: MeasureOptions);
      addTo(map: Map): this;
      remove(): this;
    }
  }


  // Extiende el namespace control para el plugin measure
  namespace control {
    function measure(options?: Control.MeasureOptions): Control.Measure;
  }

  // Mantén tus interfaces existentes
  interface MarkerOptions {
    className?: string;
  }

  interface PolylineOptions {
    className?: string;
  }

  interface Layer {
    options?: any;
  }
}
