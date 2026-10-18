import type { Event as PartyEvent, Genre } from "./types/event";
import type { DateFilter } from "./types/filters";
import type { EventQuery } from "./services/eventProvider";

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const dateFormats = new Map<string, Intl.DateTimeFormat>();

export function getAmsterdamDate(date = new Date()): string {
  return getLocalDate(date, "Europe/Amsterdam");
}

export function getLocalDate(date = new Date(), timeZone = "Europe/Amsterdam"): string {
  let formatter = dateFormats.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    dateFormats.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")!.value;
  const month = parts.find((part) => part.type === "month")!.value;
  const day = parts.find((part) => part.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

// Reken met kalenderdagen, zodat zomer- en wintertijd geen uurverschuiving geven.
function calendarDay(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(timestamp)) return NaN;
  if (new Date(timestamp).toISOString().slice(0, 10) !== date) return NaN;
  return timestamp / dayInMilliseconds;
}

export function getEventQuery(dateFilter: DateFilter, now = new Date(), timeZone = "Europe/Amsterdam"): EventQuery | null {
  const today = calendarDay(getLocalDate(now, timeZone));
  let first = today;
  let last = today;
  if (dateFilter.kind === "all") {
    first -= 1;
    last += 7;
  } else if (dateFilter.kind === "now") {
    first -= 1;
  } else if (dateFilter.kind === "tomorrow") {
    first += 1;
    last = first;
  } else if (dateFilter.kind === "weekend") {
    const weekday = new Date(today * dayInMilliseconds).getUTCDay();
    first += weekday === 0 ? -2 : weekday === 6 ? -1 : 5 - weekday;
    last = first + 2;
  } else if (dateFilter.kind === "custom") {
    first = calendarDay(dateFilter.date);
    last = first;
  }
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  return {
    from: new Date(first * dayInMilliseconds).toISOString().slice(0, 10),
    to: new Date(last * dayInMilliseconds).toISOString().slice(0, 10),
  };
}

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

export function filterEventsByDate(
  events: readonly PartyEvent[],
  dateFilter: DateFilter,
  now = new Date(),
  timeZone = "Europe/Amsterdam",
): PartyEvent[] {
  if (dateFilter.kind === "all") return [...events];

  if (dateFilter.kind === "now") {
    const timestamp = now.getTime();
    return events.filter((event) =>
      event.ends_at !== undefined &&
      Date.parse(event.starts_at) <= timestamp &&
      timestamp < Date.parse(event.ends_at),
    );
  }

  let firstDay = calendarDay(getLocalDate(now, timeZone));
  let lastDay = firstDay;

  if (dateFilter.kind === "tomorrow") {
    firstDay += 1;
    lastDay = firstDay;
  } else if (dateFilter.kind === "weekend") {
    const weekday = new Date(firstDay * dayInMilliseconds).getUTCDay();
    // Op vrijdag, zaterdag en zondag geldt het lopende weekend; anders het komende.
    const daysUntilFriday = weekday === 0 ? -2 : weekday === 6 ? -1 : 5 - weekday;
    firstDay += daysUntilFriday;
    lastDay = firstDay + 2;
  } else if (dateFilter.kind === "custom") {
    firstDay = calendarDay(dateFilter.date);
    lastDay = firstDay;
  }

  return events.filter((event) => {
    const startDay = calendarDay(getLocalDate(new Date(event.starts_at), timeZone));
    return startDay >= firstDay && startDay <= lastDay;
  });
}
