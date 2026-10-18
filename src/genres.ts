import type { Event, Genre } from "./types/event";

export const genreOptions: { value: Genre; label: string }[] = [
  { value: "house", label: "House" },
  { value: "deep-house", label: "Deep house" },
  { value: "techno", label: "Techno" },
  { value: "disco", label: "Disco" },
  { value: "drum-and-bass", label: "Drum & bass" },
];

export function normalizeGenre(name: string): Genre {
  const value = name.trim().toLowerCase().normalize("NFKD").replace(/\p{Diacritic}/gu, "");
  if (["dnb", "d&b", "drum & bass", "drum and bass", "drum'n'bass", "drum n bass"].includes(value)) {
    return "drum-and-bass";
  }
  return value.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

export function getGenreLabel(genre: Genre): string {
  return genreOptions.find((option) => option.value === genre)?.label
    ?? genre.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function getGenreOptions(events: readonly Event[], selectedGenres: readonly Genre[]) {
  const additional = [...new Set([...events.flatMap((event) => event.genres), ...selectedGenres])]
    .filter((genre) => !genreOptions.some((option) => option.value === genre))
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((value) => ({ value, label: getGenreLabel(value) }));
  return [...genreOptions, ...additional];
}
