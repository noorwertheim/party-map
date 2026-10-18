import sample from "../data/partyAtlasSample.json" with { type: "json" };
import { events as demoEvents } from "../data/events.ts";
import type { EventProvider } from "./eventProvider.ts";
import { normalizePartyAtlas } from "./normalizePartyAtlas.ts";
import type { PartyAtlasArea } from "./normalizePartyAtlas.ts";
import { createAreaResolver } from "./resolvePartyAtlasArea.ts";

export const amsterdamArea: PartyAtlasArea = {
  areaId: "29", city: "Amsterdam", timeZone: "Europe/Amsterdam",
};

export const fixtureProvider: EventProvider = {
  id: "fixture", label: "Saved Party Atlas sample", kind: "fixture",
  getEvents: async (query) => {
    if (query.location) {
      const [longitude, latitude] = query.location.center;
      // De opgeslagen Amsterdamse fixture nooit als data voor een andere stad tonen.
      const latitudeDistance = (latitude - 52.3702) * 111.2;
      const longitudeDistance = (longitude - 4.8952) * 111.2 * Math.cos(latitude * Math.PI / 180);
      if (Math.hypot(latitudeDistance, longitudeDistance) > 20) return {
        events: [], totalResults: 0, coverage: "unsupported",
        region: { name: query.location.name, timeZone: query.location.timeZone },
        warnings: ["Saved sample data only covers Amsterdam. No saved events are available for this location."],
      };
    }
    return normalizePartyAtlas(sample, amsterdamArea, "fixture");
  },
};

export const demoProvider: EventProvider = {
  id: "demo", label: "Fictional demo events", kind: "demo",
  getEvents: async () => ({
    events: demoEvents.map((event) => ({
      ...event, source: { provider: "demo", name: "Feestmap demo", eventId: event.id, kind: "demo" },
    })),
    totalResults: demoEvents.length, warnings: [],
  }),
};

export function createPartyAtlasProvider(
  endpoint = "https://partyatlas.app/api/ra-events",
  area: PartyAtlasArea = amsterdamArea,
  resolveEndpoint?: string,
): EventProvider {
  const eventsUrl = new URL(endpoint, globalThis.location?.origin ?? "http://localhost");
  const resolveArea = createAreaResolver(resolveEndpoint || new URL("./resolve-area", eventsUrl).href);
  return {
    id: "partyAtlas", label: "Party Atlas", kind: "live",
    async getEvents(query) {
      const selectedArea = query.location ? await resolveArea(query.location) : area;
      if (!selectedArea) return {
        events: [], totalResults: 0, coverage: "unsupported",
        region: query.location ? { name: query.location.name, timeZone: query.location.timeZone } : undefined,
        warnings: [`No Party Atlas event area was found near ${query.location?.name || "this location"}. Try a nearby city.`],
      };
      const url = new URL(eventsUrl);
      url.searchParams.set("areaId", selectedArea.areaId);
      url.searchParams.set("from", query.from);
      url.searchParams.set("to", query.to);
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`Party Atlas request failed (${response.status}).`);
      return normalizePartyAtlas(await response.json(), selectedArea);
    },
  };
}
