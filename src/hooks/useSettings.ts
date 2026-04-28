// src/hooks/useSettings.ts
"use client";

import { useState, useEffect } from "react";
import { apiGet } from "@/lib/api";
import { SiteSettings } from "@/types";

let cachedSettings: Partial<SiteSettings> | null = null;

export function useSettings() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>(
    cachedSettings ?? {},
  );
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;
    apiGet<any>("/settings")
      .then((res) => {
        cachedSettings = res.data?.settings ?? {};
        setSettings(cachedSettings!);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return { settings, isLoading };
}
