import { useEffect, useState } from "react";
import Map from "./Map";
import EventFilters from "./components/EventFilters";
import LocationSearch from "./components/LocationSearch";
import type { LocationResult } from "./locationSearch";
import { filterEventsByDate, filterEventsByGenres, getEventQuery } from "./filterEvents";
import { getGenreOptions } from "./genres";
import { useEvents } from "./hooks/useEvents";
import type { Event, Genre } from "./types/event";
import type { DateFilter } from "./types/filters";
import { defaultTimeZone } from "./timeZones";

const noEvents: Event[] = [];

function App() {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: "all" });
  const [now, setNow] = useState(() => new Date());
  const [location, setLocation] = useState<LocationResult | null>(null);
  const timeZone = location?.timeZone ?? defaultTimeZone;
  const dateQuery = getEventQuery(dateFilter, now, timeZone);
  const query = dateQuery && { ...dateQuery, location: location ?? undefined };
  const { result, error, loading, retry } = useEvents(query);
  const events = result?.events ?? noEvents;
  const visibleEvents = filterEventsByDate(
    filterEventsByGenres(events, selectedGenres),
    dateFilter,
    now,
    timeZone,
  );

  // Houd Now en de kalenderdatum actueel, ook na terugkeer naar de app.
  useEffect(() => {
    const refreshTime = () => setNow(new Date());
    const timer = window.setInterval(refreshTime, 30_000);
    window.addEventListener("focus", refreshTime);
    document.addEventListener("visibilitychange", refreshTime);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshTime);
      document.removeEventListener("visibilitychange", refreshTime);
    };
  }, []);

  function toggleGenre(genre: Genre) {
    setSelectedGenres((current) =>
      current.includes(genre)
        ? current.filter((value) => value !== genre)
        : [...current, genre],
    );
  }

  return (
    <main className="app">
      <header className="map-header">
        <div className="map-intro">
          <h1>Feestmap</h1>
          <p aria-live="polite" aria-atomic="true">
            {loading ? "Loading events…" : error || (result?.coverage === "unsupported" && !result.fallback
              ? "No event coverage for this location"
              : `${visibleEvents.length} of ${events.length} events · tap a pin`)}
          </p>
          {result && (
            <p className="event-source">
              {result.provider.label}{result.region ? ` · ${result.region.name}` : ""}{result.provider.kind === "fixture" ? " · not live" : ""}
            </p>
          )}
          {result?.provider.kind === "live" && query && (
            <p className="event-source">{query.from} – {query.to} · {timeZone}</p>
          )}
          {Boolean(result?.warnings.length) && (
            <details className="event-data-notice">
              <summary>{result?.fallback
                ? result.events.length ? "Live events unavailable — showing saved sample" : "Live events unavailable"
                : "Event data notice"}</summary>
              <ul>{result?.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </details>
          )}
          {(error || result?.fallback) && <button className="event-retry" type="button" onClick={retry}>Retry events</button>}
        </div>
        <LocationSearch onSelect={setLocation} />
      </header>
      <Map events={visibleEvents} location={location} />
      <EventFilters
        selectedGenres={selectedGenres}
        onToggleGenre={toggleGenre}
        onReset={() => setSelectedGenres([])}
        dateFilter={dateFilter}
        onDateFilterChange={(filter) => {
          setNow(new Date());
          setDateFilter(filter);
        }}
        onResetAll={() => {
          setSelectedGenres([]);
          setDateFilter({ kind: "all" });
        }}
        hasResults={visibleEvents.length > 0}
        genreOptions={getGenreOptions(events, selectedGenres)}
        showEmptyState={!loading && !error && result?.coverage !== "unsupported"}
        timeZone={timeZone}
      />
    </main>
  );
}

export default App;
