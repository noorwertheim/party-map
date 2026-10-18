import type { Event as PartyEvent } from "./types/event";
import { getGenreLabel } from "./genres";

function appendLink(content: HTMLElement, value: string, label: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return;
    const link = document.createElement("a");
    link.href = url.href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    const paragraph = document.createElement("p");
    paragraph.append(link);
    content.append(paragraph);
  } catch { /* Een ongeldige externe link niet tonen. */ }
}

export function createEventPopup(event: PartyEvent): HTMLElement {
  const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full", timeStyle: "short", timeZone: event.time_zone || "Europe/Amsterdam",
  });
  const content = document.createElement("article");
  content.className = "event-popup";

  const demoLabel = document.createElement("p");
  demoLabel.className = "event-popup-demo";
  demoLabel.textContent = event.source?.kind === "live" ? event.source.name
    : event.source?.kind === "fixture" ? "Saved sample event · not live"
    : "Fictional demo event";

  const title = document.createElement("h2");
  title.textContent = event.name;

  const location = document.createElement("p");
  location.textContent = [event.venue, event.city].filter(Boolean).join(" · ");

  const start = document.createElement("p");
  const startTime = document.createElement("time");
  startTime.dateTime = event.starts_at;
  startTime.textContent = dateTimeFormat.format(new Date(event.starts_at));
  start.append("Start: ", startTime);

  const genres = document.createElement("p");
  genres.className = "event-popup-genres";
  genres.textContent = event.genres.length ? event.genres.map(getGenreLabel).join(" · ") : "Genres not provided";

  // textContent voegt tekst toe zonder deze als HTML uit te voeren.
  content.append(demoLabel, title, location, start);

  if (event.ends_at) {
    const end = document.createElement("p");
    const endTime = document.createElement("time");
    endTime.dateTime = event.ends_at;
    endTime.textContent = dateTimeFormat.format(new Date(event.ends_at));
    end.append("End: ", endTime);
    content.append(end);
  }

  content.append(genres);

  if (event.time_zone) {
    const zone = document.createElement("p");
    zone.textContent = `Local time · ${event.time_zone}`;
    content.append(zone);
  }

  if (event.artists?.length) {
    const artists = document.createElement("p");
    artists.textContent = `Line-up: ${event.artists.join(", ")}`;
    content.append(artists);
  }

  if (event.source?.url) {
    appendLink(content, event.source.url, "View event at source");
  }

  if (event.ticket_url) {
    appendLink(content, event.ticket_url, "Tickets / organiser");
  }

  return content;
}
