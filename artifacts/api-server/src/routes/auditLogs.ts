import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/audit-logs", async (_req, res): Promise<void> => {
  const rows = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(2000);
  res.json(rows);
});

router.post("/audit-logs", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.adminId || !data?.action) {
    res.status(400).json({ error: "id, adminId, and action are required" });
    return;
  }
  const [row] = await db.insert(auditLogsTable).values(data).returning();
  res.status(201).json(row);
});

export default router;
