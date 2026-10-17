export type Genre = "house" | "deep-house" | "techno" | "disco" | "drum-and-bass";

export type Event = {
  id: string;
  name: string;
  venue: string;
  city: string;
  starts_at: string;
  ends_at?: string;
  genres: Genre[];
  latitude: number;
  longitude: number;
  ticket_url?: string;
};
