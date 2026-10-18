const formatters = new Map<string, Intl.DateTimeFormat>();

function wallTime(timestamp: number, timeZone: string): number {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      fractionalSecondDigits: 3,
    });
    formatters.set(timeZone, formatter);
  }
  const parts = Object.fromEntries(formatter.formatToParts(timestamp).map((part) => [part.type, part.value]));
  const date = new Date(0);
  date.setUTCFullYear(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  date.setUTCHours(Number(parts.hour), Number(parts.minute), Number(parts.second), Number(parts.fractionalSecond));
  return date.getTime();
}

// Zonder offset is een brontijd een lokale tijd van het ingestelde gebied.
export function parseEventTime(value: unknown, timeZone: string): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second = "0", fraction = "", offset] = match;
  const date = new Date(0);
  date.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  date.setUTCHours(Number(hour), Number(minute), Number(second), Number(fraction.padEnd(3, "0")));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day) || date.getUTCHours() !== Number(hour)
    || date.getUTCMinutes() !== Number(minute) || date.getUTCSeconds() !== Number(second)) return undefined;
  const local = date.getTime();

  if (offset) {
    if (offset === "Z") return date.toISOString();
    const digits = offset.slice(1).replace(":", "");
    const hours = Number(digits.slice(0, 2));
    const minutes = Number(digits.slice(2));
    if (hours > 23 || minutes > 59) return undefined;
    const delta = (hours * 60 + minutes) * 60_000 * (offset[0] === "+" ? 1 : -1);
    return new Date(local - delta).toISOString();
  }

  // Probeer offsets vóór en na een mogelijke zomer-/wintertijdwisseling.
  const probes = [local - 36 * 3_600_000, local + 36 * 3_600_000];
  const candidates = probes.map((probe) => local - (wallTime(probe, timeZone) - probe))
    .filter((timestamp) => wallTime(timestamp, timeZone) === local);
  if (!candidates.length) return undefined; // Een niet-bestaande lokale tijd niet verzinnen.
  // Bij de dubbele wintertijd kiezen we deterministisch het eerste voorkomen.
  return new Date(Math.min(...candidates)).toISOString();
}
