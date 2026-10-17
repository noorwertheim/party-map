import { useEffect, useRef } from "react";
import { Map as MapLibreMap, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [5.3, 52.1],
      zoom: 6.8,
    });

    map.addControl(new NavigationControl());

    // Pas de kleuren aan zodra de kaartstijl beschikbaar is.
    map.on("style.load", () => {
      for (const layer of map.getStyle().layers) {
        if (layer.type === "background") {
          map.setPaintProperty(layer.id, "background-color", "#f1eee8");
        }

        if (layer.type === "fill" && layer.id === "water") {
          map.setPaintProperty(layer.id, "fill-color", "#518fba");
        }

        if (layer.type === "line" && layer.id.startsWith("boundary_")) {
          map.setPaintProperty(layer.id, "line-color", "#475569");
        }

        if (layer.type === "symbol" && layer.id.startsWith("label_")) {
          map.setPaintProperty(layer.id, "text-color", "#172b40");
          map.setPaintProperty(layer.id, "text-halo-color", "#ffffff");
          map.setPaintProperty(layer.id, "text-halo-width", 1.5);
        }
      }
    });

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100vh",
      }}
    />
  );
}
