import type { FeestmapEvent } from "../types/event.ts";
import type { EventLocation } from "../types/location.ts";

export type EventQuery = { from: string; to: string; location?: EventLocation };

export function eventQueryKey(query: EventQuery): string {
  return JSON.stringify([query.from, query.to, query.location?.center, query.location?.timeZone]);
}

export type EventPage = {
  events: FeestmapEvent[];
  totalResults: number;
  warnings: string[];
  region?: { name: string; timeZone: string };
  coverage?: "available" | "unsupported";
};

export type EventProvider = {
  id: string;
  label: string;
  kind: "live" | "fixture" | "demo";
  getEvents: (query: EventQuery) => Promise<EventPage>;
};

export type EventResult = EventPage & {
  provider: Pick<EventProvider, "id" | "label" | "kind">;
  fallback: boolean;
};
