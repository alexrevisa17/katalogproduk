import type { Request, Response } from 'express';
import { getProducts } from './_shared.js';
export default async function handler(_req: Request, res: Response) {
  try { res.setHeader('Cache-Control', 'no-store'); res.json(await getProducts()); }
  catch (error) { console.error('products GET failed', error); res.status(503).json({ error: 'Database Supabase belum siap. Periksa konfigurasi dan tabel products.' }); }
}
