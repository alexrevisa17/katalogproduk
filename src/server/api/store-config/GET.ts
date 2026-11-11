import type { Request, Response } from 'express';
import { supabaseRequest } from '../../supabase.js';
import { DEFAULT_CONFIG } from './_shared.js';
export default async function handler(_req: Request, res: Response) {
  try {
    const rows = await supabaseRequest('store_config?select=store_name,logo_url,whatsapp_number&id=eq.main&limit=1') as Record<string, unknown>[];
    const row = rows[0];
    res.setHeader('Cache-Control', 'no-store');
    res.json(row ? { storeName: row.store_name, logoUrl: row.logo_url, whatsappNumber: row.whatsapp_number } : DEFAULT_CONFIG);
  } catch (error) { console.error('store config GET failed', error); res.status(503).json({ error: 'Database Supabase belum siap.' }); }
}
