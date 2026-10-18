import type { EventLocation } from "./types/location";
import { timeZoneAt } from "./timeZones";

export type LocationResult = EventLocation & {
  description: string;
  bounds?: [number, number, number, number];
  zoom: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isCoordinate(value: unknown, limit: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
}

function parseLocation(feature: unknown): LocationResult | null {
  if (!isRecord(feature) || !isRecord(feature.geometry) || !isRecord(feature.properties)) {
    return null;
  }

  const { geometry, properties } = feature;
  const coordinates = geometry.coordinates;
  if (geometry.type !== "Point" || !Array.isArray(coordinates)
    || !isCoordinate(coordinates[0], 180) || !isCoordinate(coordinates[1], 90)) {
    return null;
  }

  const address = [text(properties.street), text(properties.housenumber)].filter(Boolean).join(" ");
  const name = text(properties.name) || address || text(properties.city);
  if (!name) return null;

  const description = [...new Set([
    address,
    text(properties.city),
    text(properties.state),
    text(properties.country),
  ].filter((part) => part && part !== name))].join(", ");

  const result: LocationResult = {
    name,
    description,
    center: [coordinates[0], coordinates[1]],
    timeZone: timeZoneAt([coordinates[0], coordinates[1]]),
    zoom: properties.osm_value === "country" ? 5
      : properties.osm_value === "state" ? 8
      : ["city", "town", "village"].includes(text(properties.osm_value)) ? 12 : 16,
  };

  // Photon geeft de omvang als west, noord, oost, zuid.
  const extent = properties.extent;
  if (Array.isArray(extent) && extent.length === 4
    && isCoordinate(extent[0], 180) && isCoordinate(extent[1], 90)
    && isCoordinate(extent[2], 180) && isCoordinate(extent[3], 90)
    && extent[0] < extent[2] && extent[3] < extent[1]) {
    result.bounds = [extent[0], extent[3], extent[2], extent[1]];
  }

  return result;
}

export async function searchLocations(query: string, signal: AbortSignal): Promise<LocationResult[]> {
  const url = new URL(import.meta.env.VITE_GEOCODING_URL || "https://photon.komoot.io/api/");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", "5");

  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error("Location search is unavailable.");
  const data: unknown = await response.json();
  if (!isRecord(data) || !Array.isArray(data.features)) {
    throw new Error("Unexpected location search response.");
  }

  return data.features.map(parseLocation).filter((result) => result !== null).slice(0, 5);
}
