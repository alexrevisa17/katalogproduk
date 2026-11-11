import { loginAdmin } from "../../src/server/api/admin/_auth";
import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  loginAdmin(req, res);
}
