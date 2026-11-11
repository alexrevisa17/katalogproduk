/**
 * Test helper: generates solid-color PNG images server-side
 * and saves them via the same upload pipeline.
 * Used only for verifying the upload + display pipeline end-to-end.
 */
import type { Request, Response } from 'express';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';

const UPLOAD_DIR = '/shared-storage/public/assets/uploads/products';
const PUBLIC_PREFIX = '/airo-assets/uploads/products';

/** Minimal valid PNG builder — no external deps, pure Node.js */
function buildPng(width: number, height: number, r: number, g: number, b: number): Buffer {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  function uint32BE(n: number): Buffer {
    const b = Buffer.alloc(4);
    b.writeUInt32BE(n, 0);
    return b;
  }

  function crc32(buf: Buffer): number {
    const table = makeCrcTable();
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeCrcTable(): number[] {
    const t: number[] = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c;
    }
    return t;
  }

  function chunk(type: string, data: Buffer): Buffer {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = uint32BE(data.length);
    const crcInput = Buffer.concat([typeBytes, data]);
    const crcBytes = uint32BE(crc32(crcInput));
    return Buffer.concat([len, typeBytes, data, crcBytes]);
  }

  // IHDR: width, height, bit depth=8, color type=2 (RGB), compression=0, filter=0, interlace=0
  const ihdrData = Buffer.concat([
    uint32BE(width), uint32BE(height),
    Buffer.from([8, 2, 0, 0, 0]),
  ]);
  const ihdr = chunk('IHDR', ihdrData);

  // IDAT: raw scanlines, each prefixed with filter byte 0x00
  // Each scanline: 0x00 + R G B * width
  const scanline = Buffer.alloc(1 + width * 3);
  scanline[0] = 0x00; // filter none
  for (let x = 0; x < width; x++) {
    scanline[1 + x * 3] = r;
    scanline[2 + x * 3] = g;
    scanline[3 + x * 3] = b;
  }

  // Stack all scanlines
  const raw = Buffer.concat(Array(height).fill(scanline));

  const compressed = deflateSync(raw);

  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

interface GenerateTestBody {
  width?: number;
  height?: number;
  r?: number;
  g?: number;
  b?: number;
  label?: string;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const { width = 400, height = 400, r = 79, g = 142, b = 247, label = 'test' } =
      req.body as GenerateTestBody;

    const png = buildPng(width, height, r, g, b);
    const filename = `${label}-${width}x${height}-${randomUUID().slice(0, 6)}.png`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(join(UPLOAD_DIR, filename), png);

    res.json({
      url: `${PUBLIC_PREFIX}/${filename}`,
      width,
      height,
      sizeKb: Math.round(png.byteLength / 1024),
    });
  } catch (err) {
    console.error('generate-test error', err);
    res.status(500).json({ error: String(err) });
  }
}
