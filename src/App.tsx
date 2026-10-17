import { useEffect, useState } from "react";
import Map from "./Map";
import EventFilters from "./components/EventFilters";
import { events } from "./data/events";
import { filterEventsByDate, filterEventsByGenres, getAmsterdamDate } from "./filterEvents";
import type { Genre } from "./types/event";
import type { DateFilter } from "./types/filters";

function App() {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [dateFilter, setDateFilter] = useState<DateFilter>({ kind: "all" });
  const [today, setToday] = useState(() => getAmsterdamDate());
  const visibleEvents = filterEventsByDate(
    filterEventsByGenres(events, selectedGenres),
    dateFilter,
    today,
  );

  // Houd vandaag actueel wanneer de app na middernacht open blijft staan.
  useEffect(() => {
    const timer = window.setInterval(() => setToday(getAmsterdamDate()), 60_000);
    return () => window.clearInterval(timer);
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
        onDateFilterChange={setDateFilter}
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
