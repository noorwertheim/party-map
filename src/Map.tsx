import { useEffect, useRef } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { createEventPopup } from "./createEventPopup";
import type { Event as PartyEvent } from "./types/event";
import type { LocationResult } from "./locationSearch";

// Laat Vite de worker bundelen die straten, gebouwen en labels verwerkt.
setWorkerUrl(mapWorkerUrl);

type MapProps = {
  events: readonly PartyEvent[];
  location: LocationResult | null;
};

export default function Map({ events, location }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<MapLibreMap | null>(null);
  const eventMarkers = useRef(new globalThis.Map<string, { event: PartyEvent; marker: Marker }>());

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [4.8952, 52.3702],
      zoom: 13,
    });

    mapInstance.current = map;
    const markers = eventMarkers.current;
    map.addControl(new NavigationControl());

    // Pas de taal en kleuren aan zodra de kaartstijl beschikbaar is.
    map.on("style.load", () => {
      for (const layer of map.getStyle().layers) {
        if (layer.type === "symbol") {
          const textField: unknown = layer.layout?.["text-field"];

          // Vertaal naamlabels; behoud wegnummers en andere codes.
          if (Array.isArray(textField) && textField.flat(Infinity).includes("name")) {
            map.setLayoutProperty(layer.id, "text-field", [
              "coalesce",
              ["get", "name:en"],
              ["get", "name_en"],
              ["get", "name"],
              ["get", "name:latin"],
              "",
            ]);
          }
        }

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

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !location) return;

    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1_000;
    // Houd de gekozen plek op mobiel boven het filterpaneel zichtbaar.
    const viewport = map.getContainer().getBoundingClientRect();
    const header = map.getContainer().parentElement?.querySelector(".map-header")?.getBoundingClientRect();
    const filters = map.getContainer().parentElement?.querySelector(".filters-panel")?.getBoundingClientRect();
    const offset: [number, number] = [0, viewport.width <= 760 && header && filters
      ? (header.bottom + filters.top) / 2 - (viewport.top + viewport.height / 2)
      : 0];
    if (location.bounds) {
      const [west, south, east, north] = location.bounds;
      map.fitBounds([[west, south], [east, north]], {
        padding: 60,
        maxZoom: 16,
        offset,
        duration,
      });
    } else {
      map.flyTo({ center: location.center, zoom: location.zoom, duration, offset });
    }
  }, [location]);

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

  return <div ref={mapContainer} className="event-map" aria-label="Map of demo events in the Netherlands" />;
}
