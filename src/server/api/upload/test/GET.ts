import type { Request, Response } from 'express';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const UPLOAD_DIR = '/shared-storage/public/assets/uploads/products';
const PUBLIC_PREFIX = '/airo-assets/uploads/products';

export default async function handler(_req: Request, res: Response): Promise<void> {
  try {
    let files: string[] = [];
    try {
      files = await readdir(UPLOAD_DIR);
    } catch {
      // directory doesn't exist yet
    }

    const results = await Promise.all(
      files
        .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f))
        .map(async f => {
          const s = await stat(join(UPLOAD_DIR, f));
          return {
            filename: f,
            url: `${PUBLIC_PREFIX}/${f}`,
            sizeKb: Math.round(s.size / 1024),
          };
        }),
    );

    res.json({
      uploadDir: UPLOAD_DIR,
      count: results.length,
      files: results,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
