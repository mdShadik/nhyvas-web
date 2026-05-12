"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AddressBookEntry = {
  id: string;
  label: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

const STORAGE_KEY = "nhyvas.addressBook.v1";

function safeParse(raw: string | null): { entries: AddressBookEntry[]; defaultId: string | null } {
  if (!raw) return { entries: [], defaultId: null };
  try {
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed?.entries) ? (parsed.entries as AddressBookEntry[]) : [];
    const defaultId = typeof parsed?.defaultId === "string" ? parsed.defaultId : null;
    return { entries, defaultId };
  } catch {
    return { entries: [], defaultId: null };
  }
}

function loadFromStorage() {
  if (typeof window === "undefined") return { entries: [], defaultId: null };
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function saveToStorage(state: { entries: AddressBookEntry[]; defaultId: string | null }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `addr_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function useAddressBook() {
  const [state, setState] = useState(() => loadFromStorage());

  useEffect(() => {
    setState(loadFromStorage());
  }, []);

  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  const entries = useMemo(() => state.entries, [state.entries]);
  const defaultId = state.defaultId;
  const defaultEntry = useMemo(() => entries.find((e) => e.id === defaultId) ?? null, [defaultId, entries]);

  const add = useCallback((input: Partial<Omit<AddressBookEntry, "id" | "createdAt">> & { id?: string | null }) => {
    const id = (input.id ?? "").trim() || uid();
    const entry: AddressBookEntry = {
      id,
      label: input.label?.trim() ?? (typeof input.latitude === "number" && typeof input.longitude === "number" ? `${input.latitude.toFixed(5)}, ${input.longitude.toFixed(5)}` : ""),
      latitude: typeof input.latitude === "number" ? input.latitude : null,
      longitude: typeof input.longitude === "number" ? input.longitude : null,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => {
      const without = prev.entries.filter((e) => e.id !== id);
      const nextEntries = [entry, ...without];
      const nextDefaultId = prev.defaultId ?? id;
      return { entries: nextEntries, defaultId: nextDefaultId };
    });
    return id;
  }, []);

  const update = useCallback((id: string, patch: Partial<Omit<AddressBookEntry, "id" | "createdAt">>) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.map((e) =>
        e.id === id
          ? {
              ...e,
              label: patch.label !== undefined ? patch.label : e.label,
              latitude: patch.latitude !== undefined ? patch.latitude : e.latitude,
              longitude: patch.longitude !== undefined ? patch.longitude : e.longitude,
            }
          : e
      ),
    }));
  }, []);

  const remove = useCallback((id: string) => {
    setState((prev) => {
      const nextEntries = prev.entries.filter((e) => e.id !== id);
      const nextDefaultId = prev.defaultId === id ? (nextEntries[0]?.id ?? null) : prev.defaultId;
      return { entries: nextEntries, defaultId: nextDefaultId };
    });
  }, []);

  const setDefault = useCallback((id: string) => {
    setState((prev) => ({ ...prev, defaultId: id }));
  }, []);

  return { entries, defaultId, defaultEntry, add, update, remove, setDefault };
}

