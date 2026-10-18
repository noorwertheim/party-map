import type { Genre } from "../types/event";
import type { DateFilter } from "../types/filters";
import { getLocalDate } from "../filterEvents";

type EventFiltersProps = {
  selectedGenres: Genre[];
  onToggleGenre: (genre: Genre) => void;
  onReset: () => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onResetAll: () => void;
  hasResults: boolean;
  genreOptions: { value: Genre; label: string }[];
  showEmptyState: boolean;
  timeZone: string;
};

export default function EventFilters({
  selectedGenres,
  onToggleGenre,
  onReset,
  dateFilter,
  onDateFilterChange,
  onResetAll,
  hasResults,
  genreOptions,
  showEmptyState,
  timeZone,
}: EventFiltersProps) {
  return (
    <section className="filters-panel" aria-labelledby="filters-title">
      <div className="filters-heading">
        <h2 id="filters-title">Genre</h2>
        <button type="button" onClick={onReset} disabled={selectedGenres.length === 0}>
          All genres
        </button>
      </div>
      <fieldset className="genre-filters">
        <legend className="visually-hidden">Choose one or more music genres</legend>
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
      <p className="filter-help">Select multiple genres. House includes deep house.</p>
      <fieldset className="date-filters">
        <legend>Date</legend>
        <div className="date-options">
          <label className="date-field" htmlFor="date-period">
            When?
            <select
              id="date-period"
              value={dateFilter.kind}
              onChange={(event) => {
                const kind = event.target.value as DateFilter["kind"];
                onDateFilterChange(kind === "custom"
                  ? { kind, date: getLocalDate(new Date(), timeZone) }
                  : { kind });
              }}
            >
              <option value="all">All dates</option>
              <option value="now">Now — happening now</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="weekend">This weekend</option>
              <option value="custom">Choose a date</option>
            </select>
          </label>
          {dateFilter.kind === "custom" && (
            <label className="date-field" htmlFor="event-date">
              Which date?
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
            ? "Events currently in progress. Only events with a known end time."
            : `Dates use local time in ${timeZone}. Weekend: Friday to Sunday.`}
        </p>
      </fieldset>
      {showEmptyState && !hasResults && (
        <div className="empty-results">
          <p role="status">
            {dateFilter.kind === "custom" && !dateFilter.date
              ? "Choose a date to see events."
              : "No events found. Change the date or genres."}
          </p>
          <button type="button" className="reset-filters" onClick={onResetAll}>
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}
