import { useState } from "react";
import Map from "./Map";
import EventFilters from "./components/EventFilters";
import { events } from "./data/events";
import { filterEventsByGenres } from "./filterEvents";
import type { Genre } from "./types/event";

function App() {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const visibleEvents = filterEventsByGenres(events, selectedGenres);

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
        hasResults={visibleEvents.length > 0}
      />
    </main>
  );
}

export default App;
