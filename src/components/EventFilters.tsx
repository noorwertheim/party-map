import { genreOptions } from "../genres";
import type { Genre } from "../types/event";

type EventFiltersProps = {
  selectedGenres: Genre[];
  onToggleGenre: (genre: Genre) => void;
  onReset: () => void;
  hasResults: boolean;
};

export default function EventFilters({
  selectedGenres,
  onToggleGenre,
  onReset,
  hasResults,
}: EventFiltersProps) {
  return (
    <section className="filters-panel" aria-labelledby="filters-title">
      <div className="filters-heading">
        <h2 id="filters-title">Muziekgenre</h2>
        <button type="button" onClick={onReset} disabled={selectedGenres.length === 0}>
          Alle genres
        </button>
      </div>
      <fieldset className="genre-filters">
        <legend className="visually-hidden">Kies één of meer muziekgenres</legend>
        <div className="genre-options">
          {genreOptions.map(({ value, label }) => (
            <label
              key={value}
              className={`genre-option${selectedGenres.includes(value) ? " is-selected" : ""}`}
            >
              <input
                type="checkbox"
                value={value}
                checked={selectedGenres.includes(value)}
                onChange={() => onToggleGenre(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <p className="filter-help">Meerdere keuzes mogelijk. House is inclusief deep house.</p>
      {!hasResults && <p role="status">Geen feesten gevonden. Kies andere genres of bekijk alle genres.</p>}
    </section>
  );
}
