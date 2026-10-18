import type { EventProvider, EventQuery, EventResult } from "./eventProvider.ts";
import { eventQueryKey } from "./eventProvider.ts";
import { amsterdamArea, createPartyAtlasProvider, demoProvider, fixtureProvider } from "./providers.ts";

export function createEventService(provider: EventProvider, fallback: EventProvider = fixtureProvider) {
  const cache = new Map<string, { result: EventResult; expires: number }>();
  const pending = new Map<string, Promise<EventResult>>();

  return async (query: EventQuery, signal?: AbortSignal, refresh = false): Promise<EventResult> => {
    signal?.throwIfAborted();
    const key = eventQueryKey(query);
    const cached = cache.get(key);
    if (!refresh && cached && cached.expires > Date.now()) return cached.result;
    let promise = pending.get(key);
    if (!promise) {
      promise = (async () => {
        let result: EventResult;
        try {
          result = { ...await provider.getEvents(query), provider, fallback: false };
        } catch (error) {
          if (provider.kind !== "live") throw error;
          const page = await fallback.getEvents(query);
          result = {
            ...page, provider: fallback, fallback: true,
            warnings: [page.events.length
              ? "Live events could not be loaded. Showing saved sample events."
              : "Live events could not be loaded. No saved events are available for this location.", ...page.warnings],
          };
        }
        if (cache.size >= 30) cache.clear();
        cache.set(key, { result, expires: Date.now() + (result.fallback ? 30_000 : 300_000) });
        return result;
      })();
      pending.set(key, promise);
      void promise.finally(() => pending.delete(key)).catch(() => {});
    }
    const result = await promise;
    signal?.throwIfAborted();
    return result;
  };
}

function configuredProvider(): EventProvider {
  const env = import.meta.env ?? {};
  const choice = env.VITE_EVENT_PROVIDER || "fixture";
  if (choice === "fixture") return fixtureProvider;
  if (choice === "demo") return demoProvider;
  if (choice === "partyAtlas") {
    // De ongedocumenteerde prototypebron uitsluitend lokaal inschakelen.
    if (!env.DEV) return fixtureProvider;
    return createPartyAtlasProvider(env.VITE_PARTY_ATLAS_URL, {
      areaId: env.VITE_PARTY_ATLAS_AREA_ID || amsterdamArea.areaId,
      city: env.VITE_PARTY_ATLAS_CITY || amsterdamArea.city,
      timeZone: env.VITE_PARTY_ATLAS_TIME_ZONE || amsterdamArea.timeZone,
    }, env.VITE_PARTY_ATLAS_RESOLVE_URL);
  }
  return {
    id: "invalid", label: "Unavailable event source", kind: "fixture",
    getEvents: async () => { throw new Error("Unknown event provider. Check VITE_EVENT_PROVIDER."); },
  };
}

// Eén gedeelde service voorkomt dubbele requests door React StrictMode.
export const getEvents = createEventService(configuredProvider());
