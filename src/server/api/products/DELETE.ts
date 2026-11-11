import type { Request, Response } from 'express';
import { deleteProduct } from './_shared.js';
export default async function handler(req: Request, res: Response) {
  const id = String(req.params.id || '');
  if (!id) { res.status(400).json({ error: 'ID produk wajib diisi.' }); return; }
  try { await deleteProduct(id); res.json({ success: true }); }
  catch (error) { console.error('products DELETE failed', error); res.status(503).json({ error: 'Gagal menghapus produk dari Supabase.' }); }
}
