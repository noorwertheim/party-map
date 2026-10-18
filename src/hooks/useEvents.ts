import { useEffect, useRef, useState } from "react";
import { getEvents } from "../services/getEvents";
import type { EventQuery, EventResult } from "../services/eventProvider";
import { eventQueryKey } from "../services/eventProvider";

type LoadState = { key: string; result?: EventResult; error?: string };

export function useEvents(query: EventQuery | null) {
  const [state, setState] = useState<LoadState | null>(null);
  const [revision, setRevision] = useState(0);
  const lastRevision = useRef(0);
  const from = query?.from;
  const to = query?.to;
  const locationName = query?.location?.name;
  const longitude = query?.location?.center[0];
  const latitude = query?.location?.center[1];
  const timeZone = query?.location?.timeZone;
  const key = `${query ? eventQueryKey(query) : "none"}/${revision}`;

  useEffect(() => {
    if (!from || !to) return;
    const controller = new AbortController();
    const requestQuery: EventQuery = { from, to };
    if (locationName && longitude !== undefined && latitude !== undefined && timeZone) {
      requestQuery.location = { name: locationName, center: [longitude, latitude], timeZone };
    }
    const requestKey = `${eventQueryKey(requestQuery)}/${revision}`;
    const refresh = lastRevision.current !== revision;
    lastRevision.current = revision;
    getEvents(requestQuery, controller.signal, refresh).then((result) => {
      if (!controller.signal.aborted) setState({ key: requestKey, result });
    }).catch(() => {
      if (!controller.signal.aborted) setState({ key: requestKey, error: "Events could not be loaded. Please try again." });
    });
    return () => controller.abort();
  }, [from, to, revision, locationName, longitude, latitude, timeZone]);

  const current = state?.key === key ? state : null;
  return {
    result: query ? current?.result : undefined,
    error: query ? current?.error : undefined,
    loading: Boolean(query && !current),
    retry: () => setRevision((value) => value + 1),
  };
}
