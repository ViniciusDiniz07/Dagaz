import { Request, Response } from 'express';
import { dbAccess } from '../../db/database.js';

export async function listAuditLogs(_req: Request, res: Response): Promise<void> {
  const db = dbAccess.getMemoryDb();
  res.json({ logs: db.audit_logs });
}
