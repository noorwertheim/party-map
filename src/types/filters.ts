export type DateFilter =
  | { kind: "all" | "now" | "today" | "tomorrow" | "weekend" }
  | { kind: "custom"; date: string };
