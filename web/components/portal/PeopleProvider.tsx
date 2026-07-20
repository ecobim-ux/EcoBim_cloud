"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchPeople, type ApiPerson } from "@/lib/portal/people";

interface PeopleContextValue {
  people: ApiPerson[];
  reach: Record<string, string[]>;
  loading: boolean;
  refetch: () => void;
}

const PeopleContext = createContext<PeopleContextValue | null>(null);

/** Single fetch of the real /api/people roster, shared across every
    dashboard/tab in the authenticated portal via context — replaces the old
    per-browser localStorage People mirror so every consumer sees the same,
    live, real-time data instead of a stale local snapshot. */
export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeople] = useState<ApiPerson[]>([]);
  const [reach, setReach] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    fetchPeople().then((data) => {
      setPeople(data.people);
      setReach(data.reach);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return <PeopleContext.Provider value={{ people, reach, loading, refetch }}>{children}</PeopleContext.Provider>;
}

export function usePeople(): PeopleContextValue {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error("usePeople() must be used within a PeopleProvider");
  return ctx;
}
