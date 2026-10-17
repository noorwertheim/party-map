import type { Event as PartyEvent, Genre } from "./types/event";

export function filterEventsByGenres(
  events: readonly PartyEvent[],
  selectedGenres: readonly Genre[],
): PartyEvent[] {
  return events.filter((event) =>
    selectedGenres.length === 0 || selectedGenres.some((genre) =>
      event.genres.includes(genre) ||
      // Deep house valt ook onder het hoofdgenre house.
      (genre === "house" && event.genres.includes("deep-house")),
    ),
  );
}
