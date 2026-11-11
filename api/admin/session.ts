import { isAdminAuthenticated } from "../../src/server/api/admin/_auth";
import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ authenticated: isAdminAuthenticated(req) });
}
