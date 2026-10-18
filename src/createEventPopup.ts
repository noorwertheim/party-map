import type { Event as PartyEvent } from "./types/event";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeStyle: "short",
  timeZone: "Europe/Amsterdam",
});

export function createEventPopup(event: PartyEvent): HTMLElement {
  const content = document.createElement("article");
  content.className = "event-popup";

  const demoLabel = document.createElement("p");
  demoLabel.className = "event-popup-demo";
  demoLabel.textContent = "Fictional demo event";

  const title = document.createElement("h2");
  title.textContent = event.name;

  const location = document.createElement("p");
  location.textContent = `${event.venue} · ${event.city}`;

  const start = document.createElement("p");
  const startTime = document.createElement("time");
  startTime.dateTime = event.starts_at;
  startTime.textContent = dateTimeFormat.format(new Date(event.starts_at));
  start.append("Start: ", startTime);

  const genres = document.createElement("p");
  genres.className = "event-popup-genres";
  genres.textContent = event.genres
    .map((genre) => genre === "drum-and-bass" ? "drum & bass" : genre.replaceAll("-", " "))
    .join(" · ");

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

  if (event.ticket_url) {
    const url = new URL(event.ticket_url);
    if (url.protocol === "https:" || url.protocol === "http:") {
      const link = document.createElement("a");
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Tickets / organiser";
      content.append(link);
    }
  }

  return content;
}
