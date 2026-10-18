import tzLookup from "@photostructure/tz-lookup";

export const defaultTimeZone = "Europe/Amsterdam";

export function timeZoneAt([longitude, latitude]: [number, number]): string {
  const timeZone = tzLookup(latitude, longitude);
  // Controleer ook of de browser deze IANA-zone ondersteunt.
  new Intl.DateTimeFormat("en", { timeZone });
  return timeZone;
}
