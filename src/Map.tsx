import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { createEventPopup } from "./createEventPopup";
import type { Event as PartyEvent } from "./types/event";

type MapProps = {
  events: readonly PartyEvent[];
};

export default function Map({ events }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const eventMarkers = useRef(new globalThis.Map<string, { event: PartyEvent; marker: Marker }>());

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [5.3, 52.1],
      zoom: 6.8,
    });

    mapInstance.current = map;
    const markers = eventMarkers.current;
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

    return () => {
      markers.forEach(({ marker }) => marker.remove());
      markers.clear();
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Behoud bestaande pins en popups wanneer de klok of filters veranderen.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const markers = eventMarkers.current;
    const visibleEvents = new Set(events);
    for (const [id, entry] of markers) {
      if (!visibleEvents.has(entry.event)) {
        entry.marker.remove();
        markers.delete(id);
      }
    }

    for (const event of events) {
      if (markers.has(event.id)) continue;

      const popup = new Popup({ maxWidth: "300px", className: "event-popup-container" })
        .setDOMContent(createEventPopup(event));

      const marker = new Marker({ color: "#6d28d9" })
        .setLngLat([event.longitude, event.latitude])
        .setPopup(popup)
        .addTo(map);

      marker.getElement().setAttribute("aria-label", `${event.name} in ${event.city}`);
      marker.getElement().setAttribute("title", `${event.name} · ${event.city}`);
      markers.set(event.id, { event, marker });
    }
  }, [events]);

  return <div ref={mapContainer} className="event-map" aria-label="Kaart met fictieve feesten in Nederland" />;
}
