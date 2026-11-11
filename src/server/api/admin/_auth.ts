import type { Request, Response, NextFunction } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'bps_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function signature(timestamp: string): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return createHmac('sha256', secret).update(timestamp).digest('hex');
}

function readCookie(req: Request): string | undefined {
  const header = req.headers.cookie || '';
  const item = header.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`));
  return item?.slice(COOKIE_NAME.length + 1);
}

export function isAdminAuthenticated(req: Request): boolean {
  const token = readCookie(req);
  if (!token) return false;
  const [timestamp, supplied] = token.split('.');
  if (!timestamp || !supplied || !/^\d+$/.test(timestamp)) return false;
  const issuedAt = Number(timestamp);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > SESSION_TTL_MS || issuedAt > Date.now() + 60_000) return false;
  const expected = signature(timestamp);
  if (!expected || expected.length !== supplied.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAdminAuthenticated(req)) {
    res.status(401).json({ error: 'Sesi admin tidak valid. Silakan login kembali.' });
    return;
  }
  next();
}

export function loginAdmin(req: Request, res: Response): void {
  const configuredPin = process.env.ADMIN_PIN;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!configuredPin || !secret || secret.length < 32) {
    res.status(503).json({ error: 'ADMIN_PIN dan ADMIN_SESSION_SECRET wajib diatur di Environment Variables.' });
    return;
  }
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = attempts.get(ip);
  if (current && current.resetAt > now && current.count >= 5) {
    res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi setelah 15 menit.' });
    return;
  }
  const pin = typeof req.body?.pin === 'string' ? req.body.pin : '';
  const a = Buffer.from(pin);
  const b = Buffer.from(configuredPin);
  const valid = a.length === b.length && timingSafeEqual(a, b);
  if (!valid) {
    const next = current && current.resetAt > now ? { count: current.count + 1, resetAt: current.resetAt } : { count: 1, resetAt: now + 15 * 60 * 1000 };
    attempts.set(ip, next);
    res.status(401).json({ error: 'PIN admin salah.' });
    return;
  }
  attempts.delete(ip);
  const timestamp = String(now);
  const sig = signature(timestamp);
  if (!sig) { res.status(503).json({ error: 'Konfigurasi sesi admin belum lengkap.' }); return; }
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${timestamp}.${sig}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`);
  res.json({ authenticated: true });
}

export function logoutAdmin(_req: Request, res: Response): void {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`);
  res.json({ authenticated: false });
}
