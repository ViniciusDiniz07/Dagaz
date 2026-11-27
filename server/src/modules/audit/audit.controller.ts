import { Request, Response } from 'express';
import { dbAccess, query } from '../../db/database.js';

export async function listAuditLogs(_req: Request, res: Response): Promise<void> {
  if (dbAccess.isPostgres()) {
    const result = await query('SELECT * FROM audit_logs ORDER BY data_hora DESC LIMIT 500');
    res.json({ logs: result.rows });
    return;
  }

  const db = dbAccess.getMemoryDb();
  res.json({ logs: db.audit_logs });
}
