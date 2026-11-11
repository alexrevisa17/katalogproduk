import type { Request, Response } from 'express';
import { uploadSupabaseImage } from '../../supabase.js';
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { dataUrl } = req.body as { dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== 'string') { res.status(400).json({ error: 'Gambar tidak ditemukan.' }); return; }
    const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
    if (!match) { res.status(400).json({ error: 'Format gambar tidak valid.' }); return; }
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_SIZE_BYTES) { res.status(400).json({ error: 'Ukuran gambar maksimal 10 MB.' }); return; }
    const url = await uploadSupabaseImage(buffer, match[1]);
    res.json({ url });
  } catch (error) { console.error('Supabase image upload failed', error); res.status(503).json({ error: 'Upload ke Supabase Storage gagal. Periksa bucket product-images dan environment.' }); }
}
