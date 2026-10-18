import type { EventLocation } from "../types/location.ts";
import type { PartyAtlasArea } from "./normalizePartyAtlas.ts";

export function createAreaResolver(endpoint: string) {
  const cache = new Map<string, { area: PartyAtlasArea | null; expires: number }>();
  const pending = new Map<string, Promise<PartyAtlasArea | null>>();

  return async (location: EventLocation): Promise<PartyAtlasArea | null> => {
    const [longitude, latitude] = location.center;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)
      || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) throw new Error("Invalid search coordinates.");
    const key = JSON.stringify([longitude, latitude, location.timeZone]);
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.area;
    let promise = pending.get(key);
    if (!promise) {
      promise = (async () => {
        const url = new URL(endpoint, globalThis.location?.origin ?? "http://localhost");
        url.searchParams.set("lat", String(latitude));
        url.searchParams.set("lng", String(longitude));
        const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok) throw new Error(`Area lookup failed (${response.status}).`);
        const data = await response.json();
        if (!data || typeof data !== "object" || !("area" in data)) throw new Error("Unexpected area response.");
        let area: PartyAtlasArea | null = null;
        if (data.area !== null) {
          if (!data.area || !/^\d+$/.test(String(data.area.id)) || typeof data.area.name !== "string"
            || !data.area.name.trim()) throw new Error("Invalid event area.");
          area = { areaId: String(data.area.id), city: data.area.name.trim(), timeZone: location.timeZone };
        }
        if (cache.size >= 100) cache.clear();
        cache.set(key, { area, expires: Date.now() + 86_400_000 });
        return area;
      })();
      pending.set(key, promise);
      void promise.finally(() => pending.delete(key)).catch(() => {});
    }
    return promise;
  };
}
