export type DateFilter =
  | { kind: "all" | "today" | "tomorrow" | "weekend" }
  | { kind: "custom"; date: string };
