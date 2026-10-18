export type Genre = string;

export type FeestmapEvent = {
  id: string;
  name: string;
  venue: string;
  city: string;
  starts_at: string;
  ends_at?: string;
  time_zone?: string;
  genres: Genre[];
  latitude: number;
  longitude: number;
  ticket_url?: string;
  artists?: string[];
  source?: {
    provider: string;
    name: string;
    eventId: string;
    kind: "live" | "fixture" | "demo";
    url?: string;
  };
};

export type Event = FeestmapEvent;
