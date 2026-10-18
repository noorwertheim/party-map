import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test, mock } from "node:test";
import { normalizePartyAtlas } from "../src/services/normalizePartyAtlas.ts";
import { parseEventTime } from "../src/services/parseEventTime.ts";
import { amsterdamArea, createPartyAtlasProvider, fixtureProvider } from "../src/services/providers.ts";
import { createEventService } from "../src/services/getEvents.ts";
import { filterEventsByDate, filterEventsByGenres, getEventQuery } from "../src/filterEvents.ts";
import { getGenreOptions, normalizeGenre } from "../src/genres.ts";

const sample = JSON.parse(await readFile(new URL("../src/data/partyAtlasSample.json", import.meta.url), "utf8"));
const event = sample.data.eventListings.data[0].event;
const response = (...events) => ({ data: { eventListings: { data: events.map(event => ({ event })), totalResults: events.length } } });
const query = { from: "2026-10-19", to: "2026-10-19" };

test("normalizes the saved real response, preserving source, genres, artists and Amsterdam times", () => {
  const result = normalizePartyAtlas(sample, amsterdamArea, "fixture");
  assert.equal(result.events.length, 3);
  assert.deepEqual(result.warnings, []);
  const first = result.events[0];
  assert.equal(first.id, "partyAtlas:2524671");
  assert.equal(first.starts_at, "2026-10-19T21:00:00.000Z");
  assert.equal(first.ends_at, "2026-10-20T02:00:00.000Z");
  assert.equal(first.latitude, event.venue.location.latitude);
  assert.equal(first.longitude, event.venue.location.longitude);
  assert.equal(first.source.url, "https://ra.co/events/2524671");
  assert.equal(first.source.kind, "fixture");
  assert.deepEqual(first.genres, ["hardcore", "industrial"]);
  assert.ok(getGenreOptions(result.events, []).some(option => option.value === "hardcore"));
  assert.ok(result.events.some(item => item.genres.length === 0));
});

test("validates required fields, falls back to venue lat/lng, deduplicates and preserves unknown genres", () => {
  const alternative = { ...event, id: "other", genres: [{ name: "Drum & Bass" }, { name: "drum and bass" }, { name: "Acid Techno" }], venue: { name: "Other", lat: "52.37", lng: "4.89" } };
  const invalid = [
    { ...event, id: "missing", venue: {} },
    { ...event, id: "invalid", startTime: "2026-02-30T22:00:00" },
    { ...event, id: "latitude", venue: { location: { latitude: 91, longitude: 4 } } },
    { ...event, id: "blank", venue: { lat: "", lng: "" } },
    { ...event, id: "null", venue: { lat: null, lng: null } },
  ];
  const result = normalizePartyAtlas(response(event, event, alternative, ...invalid), amsterdamArea);
  assert.equal(result.events.length, 2);
  assert.ok(result.warnings.some(message => message.startsWith("5 event(s) omitted")));
  assert.deepEqual(result.events[1].genres, ["drum-and-bass", "acid-techno"]);
  assert.equal(result.events[1].latitude, 52.37);
  assert.equal(result.events[1].city, "Amsterdam");
  assert.equal(normalizeGenre("Deep House"), "deep-house");
});

test("accepts missing optional fields and omits unsafe URLs and invalid end times", () => {
  const result = normalizePartyAtlas(response({ ...event, genres: null, artists: null, endTime: event.startTime, contentUrl: "javascript:alert(1)" }), amsterdamArea);
  assert.deepEqual(result.events[0].genres, []);
  assert.deepEqual(result.events[0].artists, []);
  assert.equal(result.events[0].source.url, undefined);
  assert.equal(result.events[0].ends_at, undefined);
  assert.equal(filterEventsByDate(result.events, { kind: "now" }, new Date("2026-10-20T00:00:00Z")).length, 0);
});

test("distinguishes empty data, malformed/GraphQL errors, and a truncated result", () => {
  assert.deepEqual(normalizePartyAtlas(response(), amsterdamArea).events, []);
  assert.throws(() => normalizePartyAtlas({}, amsterdamArea));
  assert.throws(() => normalizePartyAtlas({ errors: [{ message: "failed" }], data: sample.data }, amsterdamArea));
  const partial = response(event);
  partial.data.eventListings.totalResults = 50;
  assert.ok(normalizePartyAtlas(partial, amsterdamArea).warnings.some(message => message.includes("1 of 50")));
});

test("converts wall times independently of system timezone and handles DST gaps/folds explicitly", () => {
  assert.equal(parseEventTime("2026-07-01T23:00:00", "Europe/Amsterdam"), "2026-07-01T21:00:00.000Z");
  assert.equal(parseEventTime("2026-12-01T23:00:00", "Europe/Amsterdam"), "2026-12-01T22:00:00.000Z");
  assert.equal(parseEventTime("2026-10-25T02:30:00", "Europe/Amsterdam"), "2026-10-25T00:30:00.000Z");
  assert.equal(parseEventTime("2026-03-29T02:30:00", "Europe/Amsterdam"), undefined);
  assert.equal(parseEventTime("2026-10-25T02:30:00+01:00", "Europe/Amsterdam"), "2026-10-25T01:30:00.000Z");
  assert.equal(parseEventTime("2026-10-25T00:30:00Z", "Europe/Amsterdam"), "2026-10-25T00:30:00.000Z");
  for (const invalid of ["2026-02-30T20:00:00", "2026-10-25T24:00:00", "2026-10-25T20:60:00", "2026-10-25T20:00:00+25:00", "bad", null]) {
    assert.equal(parseEventTime(invalid, "Europe/Amsterdam"), undefined);
  }
});

test("source-independent genre/date filters include midnight events and Now boundaries", () => {
  const events = normalizePartyAtlas(sample, amsterdamArea).events;
  assert.equal(filterEventsByDate(events, { kind: "custom", date: "2026-10-19" }).length, 3);
  assert.equal(filterEventsByDate(events, { kind: "custom", date: "2026-10-20" }).length, 0);
  assert.equal(filterEventsByGenres(events, ["hardcore"]).length, 1);
  const first = [events[0]];
  assert.equal(filterEventsByDate(first, { kind: "now" }, new Date(first[0].starts_at)).length, 1);
  assert.equal(filterEventsByDate(first, { kind: "now" }, new Date("2026-10-20T00:00:00Z")).length, 1);
  assert.equal(filterEventsByDate(first, { kind: "now" }, new Date(first[0].ends_at)).length, 0);
});

test("query windows follow Amsterdam's calendar without tying locations to provider area IDs", () => {
  const now = new Date("2026-10-17T22:30:00Z");
  assert.deepEqual(getEventQuery({ kind: "today" }, now), { from: "2026-10-18", to: "2026-10-18" });
  assert.deepEqual(getEventQuery({ kind: "now" }, now), { from: "2026-10-17", to: "2026-10-18" });
  assert.deepEqual(getEventQuery({ kind: "weekend" }, now), { from: "2026-10-16", to: "2026-10-18" });
  assert.deepEqual(getEventQuery({ kind: "tomorrow" }, new Date("2026-12-31T12:00:00Z")), { from: "2027-01-01", to: "2027-01-01" });
  assert.equal(getEventQuery({ kind: "custom", date: "2026-02-30" }, now), null);
  assert.equal(getEventQuery({ kind: "custom", date: "" }, now), null);
});

test("live provider sends only the configured area and requested window, and rejects HTTP errors", async () => {
  const fetch = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url.searchParams.get("areaId"), "29");
    assert.equal(url.searchParams.get("from"), query.from);
    assert.equal(url.searchParams.get("to"), query.to);
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify(sample), { status: 200 });
  });
  try {
    const provider = createPartyAtlasProvider();
    assert.equal((await provider.getEvents(query)).events.length, 3);
    fetch.mock.mockImplementation(async () => new Response("Unavailable", { status: 503 }));
    await assert.rejects(provider.getEvents(query), /503/);
  } finally { fetch.mock.restore(); }
});

test("shared caching deduplicates concurrent loads, permits retry, and preserves valid empty results", async () => {
  let calls = 0;
  const provider = { id: "replacement", label: "Another provider", kind: "live", getEvents: async () => { calls++; return { events: [], totalResults: 0, warnings: [] }; } };
  const load = createEventService(provider);
  const [a, b] = await Promise.all([load(query), load(query)]);
  assert.equal(calls, 1);
  assert.equal(a, b);
  assert.equal(a.fallback, false);
  assert.equal(a.provider.label, "Another provider");
  await load(query);
  assert.equal(calls, 1);
  await load(query, undefined, true);
  assert.equal(calls, 2);
  await load({ ...query, to: "2026-10-20" });
  assert.equal(calls, 3);
});

test("failed live loads fall back visibly; cancellation never applies a stale response", async () => {
  const provider = { id: "failed", label: "Failed", kind: "live", getEvents: async () => { throw new Error("Unavailable"); } };
  const result = await createEventService(provider)(query);
  assert.equal(result.fallback, true);
  assert.equal(result.provider.kind, "fixture");
  assert.equal(result.events.length, 3);
  assert.ok(result.warnings[0].includes("Showing saved sample"));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(createEventService(fixtureProvider)(query, controller.signal), { name: "AbortError" });
  let finish;
  const slow = { ...provider, getEvents: () => new Promise(resolve => { finish = resolve; }) };
  const second = new AbortController();
  const pending = createEventService(slow)(query, second.signal);
  second.abort();
  finish({ events: [], totalResults: 0, warnings: [] });
  await assert.rejects(pending, { name: "AbortError" });
});
