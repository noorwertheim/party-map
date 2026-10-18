import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { searchLocations } from "../locationSearch";
import type { LocationResult } from "../locationSearch";

type LocationSearchProps = {
  onSelect: (location: LocationResult) => void;
};

export default function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const cache = useRef(new Map<string, LocationResult[]>());

  useEffect(() => () => request.current?.abort(), []);

  function dismiss() {
    request.current?.abort();
    request.current = null;
    setResults([]);
    setMessage("");
    setLoading(false);
  }

  async function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term.length < 2 || loading) return;

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResults([]);
    setLoading(true);
    setMessage("Searching for locations…");
    const timeout = window.setTimeout(() => controller.abort(), 10_000);

    try {
      const key = term.toLocaleLowerCase("en");
      const matches = cache.current.get(key) ?? await searchLocations(term, controller.signal);
      if (controller.signal.aborted) return;
      if (cache.current.size >= 20) cache.current.clear();
      cache.current.set(key, matches);
      setResults(matches);
      setMessage(matches.length
        ? `${matches.length} location${matches.length === 1 ? "" : "s"} found. Choose a result to move the map.`
        : "No locations found. Try a city, neighbourhood or address.");
    } catch {
      // Negeer een oude zoekopdracht als de invoer intussen is gewijzigd.
      if (request.current === controller) {
        setMessage("Location search is unavailable. Please try again.");
      }
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) setLoading(false);
    }
  }

  return (
    <div className="location-search" onKeyDown={(event) => {
      if (event.key === "Escape") {
        dismiss();
        input.current?.focus();
      }
    }}>
      <form className="location-search-form" role="search" aria-label="Search locations" onSubmit={search}>
        <label htmlFor="location-query" className="visually-hidden">Search for a location</label>
        <input
          ref={input}
          id="location-query"
          type="search"
          placeholder="City, neighbourhood or address"
          autoComplete="off"
          enterKeyHint="search"
          minLength={2}
          maxLength={200}
          required
          value={query}
          onChange={(event) => {
            dismiss();
            setQuery(event.target.value);
          }}
        />
        <button type="submit" disabled={loading || query.trim().length < 2}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      <div className={message ? "location-search-dropdown" : undefined}>
        <p className={message ? "location-search-status" : "visually-hidden"} role="status" aria-atomic="true">
          {message}
        </p>
        {results.length > 0 && (
          <ul className="location-search-results" aria-label="Location results">
            {results.map((result, index) => (
              <li key={`${result.center.join(",")}-${index}`}>
                <button type="button" onClick={() => {
                  onSelect({ ...result });
                  setQuery(result.name);
                  dismiss();
                  input.current?.focus();
                }}>
                  <strong>{result.name}</strong>
                  {result.description && <span>{result.description}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {message && (
          <p className="location-search-credit">
            Search by <a href="https://photon.komoot.io/" target="_blank" rel="noopener noreferrer">Photon</a>
            {" · "}<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap</a>
          </p>
        )}
      </div>
    </div>
  );
}
