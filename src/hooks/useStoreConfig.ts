import { useState, useEffect } from 'react';
import { DEFAULT_CONFIG, type StoreConfig } from '@/lib/store-config';

let cachedConfig: StoreConfig | null = null;
const listeners: Array<(c: StoreConfig) => void> = [];

function notifyAll(c: StoreConfig) {
  cachedConfig = c;
  listeners.forEach(fn => fn(c));
}

export async function fetchStoreConfig(): Promise<StoreConfig> {
  try {
    const res = await fetch('/api/store-config');
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json() as StoreConfig;
    notifyAll(data);
    return data;
  } catch {
    return cachedConfig ?? DEFAULT_CONFIG;
  }
}

export async function saveStoreConfig(patch: Partial<StoreConfig>): Promise<StoreConfig> {
  const res = await fetch('/api/store-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? 'Gagal menyimpan');
  }
  const updated = await res.json() as StoreConfig;
  notifyAll(updated);
  return updated;
}

/** React hook — returns live config, re-renders when admin saves */
export function useStoreConfig(): StoreConfig {
  const [config, setConfig] = useState<StoreConfig>(cachedConfig ?? DEFAULT_CONFIG);

  useEffect(() => {
    listeners.push(setConfig);
    // Fetch fresh on mount if not cached
    if (!cachedConfig) {
      fetchStoreConfig().then(setConfig).catch(() => {});
    }
    return () => {
      const idx = listeners.indexOf(setConfig);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  return config;
}
