import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isAdminAuthenticated } from '../../src/server/api/admin/_auth.js';
import { createSupabaseSignedImageUpload } from '../../src/server/supabase.js';

// Dedicated Vercel function for signed image-upload URL creation.
// This avoids relying on the Express catch-all route for this nested endpoint.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!isAdminAuthenticated(req as never)) {
    return res.status(401).json({ error: 'Sesi admin tidak valid. Silakan login kembali.' });
  }

  const mime = typeof req.body?.mime === 'string' ? req.body.mime : '';
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) {
    return res.status(400).json({ error: 'Format gambar harus JPG, PNG, WebP, atau GIF.' });
  }

  try {
    const result = await createSupabaseSignedImageUpload(mime);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Dedicated Supabase signed upload endpoint failed', error);
    const detail = error instanceof Error ? error.message : 'Kesalahan tidak diketahui.';
    return res.status(503).json({
      error: `Tidak dapat menyiapkan upload Supabase Storage: ${detail.slice(0, 220)}`,
    });
  }
}
