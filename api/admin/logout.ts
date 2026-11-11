import { logoutAdmin } from "../../src/server/api/admin/_auth";
import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  logoutAdmin(req, res);
}
