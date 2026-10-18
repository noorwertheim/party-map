# Feestmap

React + TypeScript + Vite application for discovering music events on a map.

```sh
npm install
npm run dev
npm run build
npm run lint
npm test
```

Use Node.js 22.18 or newer for the TypeScript-based tests. The interface is English. Date filters use the selected location's timezone; event popups show the venue's local time. Amsterdam remains the starting view.

## Event sources

The UI loads events through `src/services/getEvents.ts`. Each provider implements the same `EventProvider` interface and returns the internal `FeestmapEvent` model. Map components and filters do not read Party Atlas response fields.

Set the source in `.env.local`, then restart Vite:

| `VITE_EVENT_PROVIDER` | Behaviour |
| --- | --- |
| `fixture` (default) | Three saved Party Atlas events for Amsterdam on 19 October 2026. No events API requests. |
| `partyAtlas` | Live requests during local Vite development only. Production builds use the saved fixture. |
| `demo` | The original 20 fictional events for UI development. |

This checkout has `partyAtlas` enabled locally in the ignored `.env.local`, following the developer’s request. Permission for ongoing/public reuse has not been established. The endpoint is undocumented; local-only operation is a scope restriction, not a statement about usage rights. Public use needs a supported/licensed source and its agreed conditions.

Copy optional settings from `.env.example` when needed:

```dotenv
VITE_EVENT_PROVIDER=partyAtlas
VITE_PARTY_ATLAS_URL=https://partyatlas.app/api/ra-events
VITE_PARTY_ATLAS_AREA_ID=29
VITE_PARTY_ATLAS_CITY=Amsterdam
VITE_PARTY_ATLAS_TIME_ZONE=Europe/Amsterdam
# Optional when using a proxy with a different area lookup route:
# VITE_PARTY_ATLAS_RESOLVE_URL=https://partyatlas.app/api/resolve-area
```

Search for a city, neighbourhood or address anywhere in the world and choose a result. In local live mode, the app resolves its coordinates through Party Atlas's `/api/resolve-area`, then requests events for the returned area ID. No fixed city list or guessed area IDs are used. Coordinate lookups are cached for 24 hours and shared across concurrent loads. London (area 13) and Tokyo (area 27) have been checked against actual responses. The initial area still defaults to Amsterdam (29); the area/city/timezone environment settings configure that initial source area.

Worldwide search does not guarantee event coverage in every place. A missing event area produces an explicit coverage message and no events request. A broad location such as a country selects the provider area near its search coordinates; it does not download events for the entire country. Moving the map by hand only changes the view; choose a location in search to change the event area. An endpoint may also be a same-origin proxy URL; the area endpoint defaults to `resolve-area` beside the events endpoint and can be configured separately. No credentials are currently needed, and secrets must not be put in `VITE_` variables.

“All dates” loads yesterday through the next seven days in the selected location's timezone; other date filters request their matching local date window. “Now” also requests yesterday to include events continuing after midnight. Genre filters run locally and do not send requests. Results are cached for five minutes by location, timezone and date window, and simultaneous identical requests share one load. There is no background polling. Each HTTP request times out after ten seconds. An unavailable or malformed API response falls back to saved data with a visible notice and a retry button. Saved Amsterdam samples are only available within 20 km of Amsterdam; searches elsewhere remain empty on failure instead of showing unrelated sample pins. Valid empty API results remain empty. Fallbacks are cached for thirty seconds; Retry bypasses the cache.

The normalizer validates coordinates and required fields, namespaces IDs, deduplicates events, retains extra genres, and records the original source and URL. Missing genres/line-ups are allowed; missing or invalid end times exclude an event from Now. If the response reports more events than it contains, the UI shows a notice rather than guessing an undocumented pagination scheme.

Party Atlas timestamps without an offset are interpreted in the venue's timezone, determined from its coordinates. Explicit offsets are respected. Nonexistent local times during the spring DST change are omitted; ambiguous autumn times use the earlier occurrence. An explicit offset is needed to resolve the source’s ambiguity otherwise. The browser-compatible `@photostructure/tz-lookup` package estimates timezone boundaries; its compact dataset may be inaccurate near timezone borders.

The saved fixture is a reduced snapshot from one response for 19 October 2026. It is labelled “not live”; choose that date to inspect all three sample events. It is not refreshed automatically.

To add a source, implement `EventProvider.getEvents(query)` with validation and normalization, then register it in `configuredProvider()` in `getEvents.ts`. Its internal IDs should include the source namespace and its source URLs must use HTTP(S). Infrastructure, authentication, pagination, and rate controls specific to a future provider belong in that provider or an appropriate backend, not in the map.

## Location search

Location search uses the [Photon API](https://github.com/komoot/photon) on form submission. It prefers English names, moves the map and updates the event source area while preserving genre and date filter choices. No API key is needed for the prototype. The public demo service may throttle heavy usage and has no availability guarantee. Set `VITE_GEOCODING_URL` to a Photon-compatible `/api/` endpoint to replace it.

## Verification

`npm test` covers provider response validation, missing fields, genre normalization, source links, duplicate events, regional date filters, after-midnight events, DST, worldwide timezone lookup, coordinate-to-area resolution, location-aware caches, concurrent loads, cancellation, empty results, unsupported areas and geographically appropriate fallback behaviour. Browser checks additionally exercise search-driven city changes, map pins, local popup times, loading states, mobile layout, area endpoint CORS and the absence of Party Atlas requests in a production build.
