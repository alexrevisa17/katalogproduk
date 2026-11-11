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


export async function createSupabaseSignedImageUpload(mime: string) {
  assertSupabaseConfigured();
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' } as Record<string, string>)[mime];
  if (!ext) throw new Error('Tipe gambar tidak didukung.');
  const name = `${Date.now()}-${randomUUID()}.${ext}`;
  const response = await fetch(`${base()}/storage/v1/object/upload/sign/product-images/${name}`, {
    method: 'POST',
    headers: { apikey: key(), Authorization: `Bearer ${key()}`, 'x-upsert': 'false' },
  });
  const responseText = await response.text();
  let payload: { url?: string; signedURL?: string; signedUrl?: string; token?: string; error?: string; message?: string } = {};
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as typeof payload;
    } catch {
      const detail = responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
      throw new Error(`Supabase Storage mengirim respons bukan JSON (HTTP ${response.status}): ${detail || 'respons kosong'}`);
    }
  }
  if (!response.ok) throw new Error(`Supabase Storage ${response.status}: ${payload.message || payload.error || 'Gagal membuat signed upload URL'}`);
  const signedPath = payload.url || payload.signedURL || payload.signedUrl;
  if (!signedPath) throw new Error('Supabase tidak mengembalikan signed upload URL.');

  // Supabase returns a path such as /object/upload/sign/<bucket>/<name>?token=...
  // Build the final endpoint from our configured project origin, rather than
  // concatenating arbitrary path prefixes (which can create a broken URL).
  let token = payload.token;
  try {
    const returnedUrl = new URL(signedPath, `${base()}/storage/v1/`);
    token = token || returnedUrl.searchParams.get('token') || undefined;
  } catch {
    throw new Error('Format signed upload URL dari Supabase tidak valid.');
  }
  if (!token) throw new Error('Supabase tidak mengembalikan token signed upload.');

  const projectUrl = new URL(base());
  const uploadUrl = new URL(
    `/storage/v1/object/upload/sign/product-images/${encodeURIComponent(name)}`,
    projectUrl.origin,
  );
  uploadUrl.searchParams.set('token', token);
  return {
    uploadUrl: uploadUrl.toString(),
    publicUrl: `${base()}/storage/v1/object/public/product-images/${name}`,
  };
}
