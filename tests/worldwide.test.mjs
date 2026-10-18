import assert from "node:assert/strict";
import { test, mock } from "node:test";
import { timeZoneAt } from "../src/timeZones.ts";
import { getLocalDate, getEventQuery, filterEventsByDate } from "../src/filterEvents.ts";
import { createAreaResolver } from "../src/services/resolvePartyAtlasArea.ts";
import { createPartyAtlasProvider, fixtureProvider } from "../src/services/providers.ts";
import { createEventService } from "../src/services/getEvents.ts";
import { normalizePartyAtlas } from "../src/services/normalizePartyAtlas.ts";
import { parseEventTime } from "../src/services/parseEventTime.ts";

const london = { name: "London", center: [-0.128, 51.507], timeZone: "Europe/London" };
const tokyo = { name: "Tokyo", center: [139.701, 35.658], timeZone: "Asia/Tokyo" };
const date = { from: "2026-10-19", to: "2026-10-19" };
const rawEvent = (location, id = "test") => ({
  data: { eventListings: { totalResults: 1, data: [{ event: {
    id, title: `${location.name} event`, startTime: "2026-10-19T23:00:00.000", endTime: "2026-10-20T04:00:00.000",
    contentUrl: `/events/${id}`, genres: [], venue: {
      name: "Test venue", location: { latitude: location.center[1], longitude: location.center[0] },
    },
  } }] } },
});

test("coordinate timezone lookup covers multiple continents and fractional UTC offsets", () => {
  for (const [center, expected] of [
    [london.center, "Europe/London"], [tokyo.center, "Asia/Tokyo"],
    [[-74.006, 40.713], "America/New_York"], [[-118.244, 34.052], "America/Los_Angeles"],
    [[151.2093, -33.8688], "Australia/Sydney"], [[174.7633, -36.8485], "Pacific/Auckland"],
    [[-46.633, -23.550], "America/Sao_Paulo"], [[18.424, -33.925], "Africa/Johannesburg"],
  ]) assert.equal(timeZoneAt(center), expected);
  assert.equal(parseEventTime("2026-10-19T23:00:00", timeZoneAt([85.324, 27.717])), "2026-10-19T17:15:00.000Z");
  assert.equal(parseEventTime("2026-10-04T02:30:00", "Australia/Sydney"), undefined);
});

test("today, custom dates and weekend boundaries follow the selected region, not Amsterdam", () => {
  const now = new Date("2026-10-19T00:30:00Z");
  assert.equal(getLocalDate(now, "America/New_York"), "2026-10-18");
  assert.equal(getLocalDate(now, "Asia/Tokyo"), "2026-10-19");
  assert.deepEqual(getEventQuery({ kind: "today" }, now, "America/New_York"), { from: "2026-10-18", to: "2026-10-18" });
  assert.deepEqual(getEventQuery({ kind: "today" }, now, "Asia/Tokyo"), { from: "2026-10-19", to: "2026-10-19" });
  assert.deepEqual(getEventQuery({ kind: "weekend" }, now, "Asia/Tokyo"), { from: "2026-10-23", to: "2026-10-25" });
  assert.deepEqual(getEventQuery({ kind: "weekend" }, now, "America/New_York"), { from: "2026-10-16", to: "2026-10-18" });
  const events = [{ starts_at: "2026-10-18T15:30:00Z" }]; // 00:30 Monday in Tokyo.
  assert.equal(filterEventsByDate(events, { kind: "custom", date: "2026-10-19" }, now, "Asia/Tokyo").length, 1);
  assert.equal(filterEventsByDate(events, { kind: "custom", date: "2026-10-19" }, now, "Europe/Amsterdam").length, 0);
});

test("normalization and popup metadata use each venue's local timezone", () => {
  for (const [location, start, end] of [
    [london, "2026-10-19T22:00:00.000Z", "2026-10-20T03:00:00.000Z"],
    [tokyo, "2026-10-19T14:00:00.000Z", "2026-10-19T19:00:00.000Z"],
  ]) {
    const result = normalizePartyAtlas(rawEvent(location), { areaId: "test", city: location.name, timeZone: location.timeZone });
    assert.equal(result.events[0].starts_at, start);
    assert.equal(result.events[0].ends_at, end);
    assert.equal(result.events[0].time_zone, location.timeZone);
    assert.equal(result.region.name, location.name);
  }
});

test("area lookup validates, caches and shares requests without guessing area IDs", async () => {
  let calls = 0;
  const fetch = mock.method(globalThis, "fetch", async url => {
    calls++;
    assert.equal(url.searchParams.get("lat"), "51.507");
    assert.equal(url.searchParams.get("lng"), "-0.128");
    return new Response(JSON.stringify({ area: { id: "13", name: "London" } }));
  });
  try {
    const resolve = createAreaResolver("https://example.test/resolve-area");
    const [a, b] = await Promise.all([resolve(london), resolve(london)]);
    assert.equal(calls, 1);
    assert.equal(a, b);
    assert.equal((await resolve(london)).areaId, "13");
    assert.equal(calls, 1);
    fetch.mock.mockImplementation(async () => new Response(JSON.stringify({ area: null })));
    assert.equal(await resolve(tokyo), null);
    fetch.mock.mockImplementation(async () => new Response(JSON.stringify({ area: { id: null } })));
    await assert.rejects(createAreaResolver("https://example.test/area")(london));
    await assert.rejects(resolve({ ...london, center: [181, 0] }));
  } finally { fetch.mock.restore(); }
});

test("worldwide provider resolves the selected place before requesting that area's events", async () => {
  const eventAreas = [];
  let lookups = 0;
  const fetch = mock.method(globalThis, "fetch", async url => {
    if (url.pathname.endsWith("resolve-area")) {
      lookups++;
      const isTokyo = url.searchParams.get("lng") === String(tokyo.center[0]);
      return new Response(JSON.stringify({ area: { id: isTokyo ? "27" : "13", name: isTokyo ? "Tokyo" : "London" } }));
    }
    eventAreas.push(url.searchParams.get("areaId"));
    return new Response(JSON.stringify(rawEvent(url.searchParams.get("areaId") === "27" ? tokyo : london)));
  });
  try {
    const load = createEventService(createPartyAtlasProvider());
    const a = await load({ ...date, location: london });
    const b = await load({ ...date, location: tokyo });
    assert.deepEqual(eventAreas, ["13", "27"]);
    assert.equal(a.region.name, "London");
    assert.equal(b.region.name, "Tokyo");
    assert.notEqual(a.events[0].starts_at, b.events[0].starts_at);
    await load({ ...date, location: london });
    assert.equal(eventAreas.length, 2, 'city caches must be separate and reusable');
    await load({ from: "2026-10-20", to: "2026-10-20", location: london });
    assert.equal(lookups, 2, 'changing dates must reuse the area lookup');
  } finally { fetch.mock.restore(); }
});

test("unsupported locations remain empty without requesting Amsterdam events or using fixtures", async () => {
  let calls = 0;
  const fetch = mock.method(globalThis, "fetch", async url => {
    calls++;
    assert.ok(url.pathname.endsWith("resolve-area"));
    return new Response(JSON.stringify({ area: null }));
  });
  try {
    const result = await createEventService(createPartyAtlasProvider())({ ...date, location: tokyo });
    assert.equal(calls, 1);
    assert.equal(result.coverage, "unsupported");
    assert.equal(result.fallback, false);
    assert.deepEqual(result.events, []);
    assert.equal(result.region.name, "Tokyo");
  } finally { fetch.mock.restore(); }
});

test("network failures in other countries never show Amsterdam sample pins", async () => {
  assert.deepEqual((await fixtureProvider.getEvents({ ...date, location: tokyo })).events, []);
  const failed = { id: "failed", kind: "live", label: "Failed", getEvents: async () => { throw new Error("Unavailable"); } };
  const result = await createEventService(failed)({ ...date, location: tokyo });
  assert.equal(result.fallback, true);
  assert.deepEqual(result.events, []);
  assert.ok(result.warnings.some(message => message.includes("No saved events")));
});
