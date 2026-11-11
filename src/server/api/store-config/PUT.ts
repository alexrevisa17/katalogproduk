import type { Request, Response } from 'express';
import { supabaseRequest } from '../../supabase.js';
import { DEFAULT_CONFIG } from './_shared.js';
export default async function handler(req: Request, res: Response) {
  try {
    const body = req.body as Record<string, unknown>;
    const existingRows = await supabaseRequest('store_config?select=store_name,logo_url,whatsapp_number&id=eq.main&limit=1') as Record<string, unknown>[];
    const existing = existingRows[0] ? { storeName: String(existingRows[0].store_name), logoUrl: String(existingRows[0].logo_url), whatsappNumber: String(existingRows[0].whatsapp_number) } : DEFAULT_CONFIG;
    const current = { ...existing, ...(body.storeName !== undefined ? { storeName: String(body.storeName).trim() } : {}), ...(body.logoUrl !== undefined ? { logoUrl: String(body.logoUrl).trim() } : {}), ...(body.whatsappNumber !== undefined ? { whatsappNumber: String(body.whatsappNumber).replace(/\D/g, '') } : {}) };
    if (current.whatsappNumber.length < 8 || current.whatsappNumber.length > 15) { res.status(400).json({ error: 'Nomor WhatsApp tidak valid (8–15 digit).' }); return; }
    if (!current.storeName || current.storeName.length > 80) { res.status(400).json({ error: 'Nama toko wajib diisi (maksimal 80 karakter).' }); return; }
    const rows = await supabaseRequest('store_config?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ id: 'main', store_name: current.storeName, logo_url: current.logoUrl, whatsapp_number: current.whatsappNumber }) }) as Record<string, unknown>[];
    const row = rows[0]; res.json(row ? { storeName: row.store_name, logoUrl: row.logo_url, whatsappNumber: row.whatsapp_number } : current);
  } catch (error) { console.error('store config PUT failed', error); res.status(503).json({ error: 'Gagal menyimpan pengaturan ke Supabase. Periksa tabel store_config.' }); }
}
