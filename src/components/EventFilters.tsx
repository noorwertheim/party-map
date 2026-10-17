import { genreOptions } from "../genres";
import type { Genre } from "../types/event";
import type { DateFilter } from "../types/filters";
import { getAmsterdamDate } from "../filterEvents";

type EventFiltersProps = {
  selectedGenres: Genre[];
  onToggleGenre: (genre: Genre) => void;
  onReset: () => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onResetAll: () => void;
  hasResults: boolean;
};

export default function EventFilters({
  selectedGenres,
  onToggleGenre,
  onReset,
  dateFilter,
  onDateFilterChange,
  onResetAll,
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
      <fieldset className="date-filters">
        <legend>Datum</legend>
        <div className="date-options">
          <label className="date-field" htmlFor="date-period">
            Wanneer?
            <select
              id="date-period"
              value={dateFilter.kind}
              onChange={(event) => {
                const kind = event.target.value as DateFilter["kind"];
                onDateFilterChange(kind === "custom"
                  ? { kind, date: getAmsterdamDate() }
                  : { kind });
              }}
            >
              <option value="all">Alle datums</option>
              <option value="now">Now — nu bezig</option>
              <option value="today">Vandaag</option>
              <option value="tomorrow">Morgen</option>
              <option value="weekend">Dit weekend</option>
              <option value="custom">Kies een datum</option>
            </select>
          </label>
          {dateFilter.kind === "custom" && (
            <label className="date-field" htmlFor="event-date">
              Welke datum?
              <input
                id="event-date"
                type="date"
                required
                value={dateFilter.date}
                onChange={(event) => onDateFilterChange({ kind: "custom", date: event.target.value })}
              />
            </label>
          )}
        </div>
        <p className="filter-help">
          {dateFilter.kind === "now"
            ? "Al begonnen en nog niet afgelopen. Alleen feesten met een bekende eindtijd."
            : "De startdatum in Nederland telt. Weekend: vrijdag t/m zondag."}
        </p>
      </fieldset>
      {!hasResults && (
        <div className="empty-results">
          <p role="status">
            {dateFilter.kind === "custom" && !dateFilter.date
              ? "Kies een datum om feesten te bekijken."
              : "Geen feesten gevonden. Pas je datum of genres aan."}
          </p>
          <button type="button" className="reset-filters" onClick={onResetAll}>
            Wis alle filters
          </button>
        </div>
      )}
    </section>
  );
}
