import type { Request, Response } from 'express';
import { saveProduct, validateProduct } from './_shared.js';
export default async function handler(req: Request, res: Response) {
  try { const product = validateProduct(req.body); res.json(await saveProduct(product)); }
  catch (error) { console.error('products POST failed', error); res.status(400).json({ error: error instanceof Error ? error.message : 'Gagal menyimpan produk.' }); }
}
