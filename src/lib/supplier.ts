"use client";

import { useCallback, useEffect, useState } from "react";

/** Håller leverantörsnyckeln i sessionStorage och skickar den med varje anrop. */
export function useSupplierKey() {
  const [key, setKeyState] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    try {
      setKeyState(sessionStorage.getItem("forme-key"));
    } catch {
      setKeyState(null);
    }
  }, []);
  const setKey = useCallback((k: string | null) => {
    setKeyState(k);
    try {
      if (k) sessionStorage.setItem("forme-key", k);
      else sessionStorage.removeItem("forme-key");
    } catch {}
  }, []);
  const api = useCallback(
    (url: string, init: RequestInit = {}, withKey = key) =>
      fetch(url, { ...init, headers: { "content-type": "application/json", "x-forme-key": withKey ?? "" } }),
    [key],
  );
  return { key, setKey, api };
}
