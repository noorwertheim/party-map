import type { FeestmapEvent } from "../types/event.ts";
import { normalizeGenre } from "../genres.ts";
import type { EventPage } from "./eventProvider.ts";
import { parseEventTime } from "./parseEventTime.ts";
import { timeZoneAt } from "../timeZones.ts";

export type PartyAtlasArea = { areaId: string; city: string; timeZone: string };

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function coordinate(value: unknown, limit: number): number | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  if (typeof value === "string" && !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : undefined;
}

function sourceUrl(value: unknown): string | undefined {
  if (!text(value)) return undefined;
  try {
    const url = new URL(text(value), "https://ra.co");
    return ["http:", "https:"].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

function names(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string" ? text(item) : text(record(item).name)).filter(Boolean);
}

export function normalizePartyAtlas(
  response: unknown,
  area: PartyAtlasArea,
  kind: "live" | "fixture" = "live",
): EventPage {
  const root = record(response);
  if (Array.isArray(root.errors) && root.errors.length) throw new Error("Party Atlas returned an API error.");
  const listing = record(record(root.data).eventListings);
  if (!Array.isArray(listing.data)) throw new Error("Unexpected Party Atlas response structure.");
  const events: FeestmapEvent[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  let missingEndTimes = 0;

  for (const item of listing.data) {
    const raw = record(record(item).event);
    const venue = record(raw.venue);
    const location = record(venue.location);
    const originalId = typeof raw.id === "number" ? String(raw.id) : text(raw.id);
    const name = text(raw.title);
    const latitude = coordinate(location.latitude, 90) ?? coordinate(venue.lat, 90);
    const longitude = coordinate(location.longitude, 180) ?? coordinate(venue.lng, 180);
    if (!originalId || !name || latitude === undefined || longitude === undefined) {
      skipped++;
      continue;
    }
    const timeZone = timeZoneAt([longitude, latitude]);
    const starts_at = parseEventTime(raw.startTime, timeZone);
    if (!starts_at) { skipped++; continue; }
    if (seen.has(originalId)) continue;
    seen.add(originalId);
    const end = parseEventTime(raw.endTime, timeZone);
    const ends_at = end && Date.parse(end) > Date.parse(starts_at) ? end : undefined;
    if (raw.endTime && !ends_at) missingEndTimes++;

    events.push({
      id: `partyAtlas:${originalId}`,
      name,
      venue: text(venue.name) || "Unknown venue",
      city: text(record(venue.area).name) || area.city,
      starts_at,
      ends_at,
      time_zone: timeZone,
      genres: [...new Set(names(raw.genres).map(normalizeGenre).filter(Boolean))],
      artists: [...new Set(names(raw.artists))],
      latitude,
      longitude,
      source: {
        provider: "partyAtlas", name: "Party Atlas / Resident Advisor", eventId: originalId,
        kind, url: sourceUrl(raw.contentUrl),
      },
    });
  }

  const totalResults = typeof listing.totalResults === "number" && Number.isSafeInteger(listing.totalResults)
    && listing.totalResults >= 0 ? listing.totalResults : listing.data.length;
  const warnings: string[] = [];
  if (skipped) warnings.push(`${skipped} event(s) omitted because required location or date information is missing or invalid.`);
  if (missingEndTimes) warnings.push(`${missingEndTimes} event(s) have an invalid end time and will not appear in Now.`);
  if (totalResults > listing.data.length) warnings.push(`The source returned ${listing.data.length} of ${totalResults} events. Try a narrower date range.`);
  return { events, totalResults, warnings, region: { name: area.city, timeZone: area.timeZone }, coverage: "available" };
}
