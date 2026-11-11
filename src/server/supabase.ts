import { randomUUID } from 'node:crypto';

const base = () => (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export function assertSupabaseConfigured() {
  if (!base() || !key()) throw new Error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY belum diatur.');
}
export async function supabaseRequest(path: string, init: RequestInit = {}) {
  assertSupabaseConfigured();
  const headers = new Headers(init.headers);
  headers.set('apikey', key());
  headers.set('Authorization', `Bearer ${key()}`);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  const response = await fetch(`${base()}/rest/v1/${path}`, { ...init, headers });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${body.slice(0, 500)}`);
  return body ? JSON.parse(body) : null;
}
export async function uploadSupabaseImage(data: Buffer, mime: string) {
  assertSupabaseConfigured();
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string,string>)[mime];
  if (!ext) throw new Error('Tipe gambar tidak didukung.');
  const name = `${Date.now()}-${randomUUID()}.${ext}`;
  const binary = new ArrayBuffer(data.byteLength);
  new Uint8Array(binary).set(data);
  const response = await fetch(`${base()}/storage/v1/object/product-images/${name}`, {
    method: 'POST', headers: { apikey: key(), Authorization: `Bearer ${key()}`, 'Content-Type': mime, 'x-upsert': 'false' }, body: binary,
  });
  if (!response.ok) throw new Error(`Supabase Storage ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return `${base()}/storage/v1/object/public/product-images/${name}`;
}
