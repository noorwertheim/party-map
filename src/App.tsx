import { useEffect, useState } from "react";
import Map from "./Map";
import EventFilters from "./components/EventFilters";
import { events } from "./data/events";
import { filterEventsByDate, filterEventsByGenres } from "./filterEvents";
import type { Genre } from "./types/event";
import type { DateFilter } from "./types/filters";

function App() {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: "all" });
  const [now, setNow] = useState(() => new Date());
  const visibleEvents = filterEventsByDate(
    filterEventsByGenres(events, selectedGenres),
    dateFilter,
    now,
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
      <header className="map-intro">
        <h1>Feestmap</h1>
        <p aria-live="polite" aria-atomic="true">
          {visibleEvents.length} van {events.length} fictieve feesten · tik op een pin
        </p>
      </header>
      <Map events={visibleEvents} />
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
      />
    </main>
  );
}

export default App;
