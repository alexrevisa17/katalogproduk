/**
 * Store configuration — single source of truth for WhatsApp number and logo.
 * Frontend reads from /api/store-config; admin writes via PUT /api/store-config.
 */

export interface StoreConfig {
  whatsappNumber: string;   // e.g. "6282340619639"
  logoUrl: string;          // e.g. "/airo-assets/images/logo/horizontal" or uploaded URL
  storeName: string;
}

export const DEFAULT_CONFIG: StoreConfig = {
  whatsappNumber: '6282340619639',
  logoUrl: '/airo-assets/images/logo/horizontal',
  storeName: 'Bang Pray Store',
};

/** Build a wa.me URL from a raw number string */
export function buildWaUrl(number: string, message = 'Halo%2C+saya+ingin+menanyakan+stok+produk'): string {
  const clean = number.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${message}`;
}
