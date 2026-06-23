import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, pinChangeRequestsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/pin-changes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(pinChangeRequestsTable).orderBy(desc(pinChangeRequestsTable.createdAt));
  res.json(rows);
});

router.post("/pin-changes", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.userId || !data?.pendingPin) {
    res.status(400).json({ error: "id, userId, and pendingPin are required" });
    return;
  }
  const [row] = await db.insert(pinChangeRequestsTable).values(data).returning();
  res.status(201).json(row);
});

router.post("/pin-changes/:id/approve", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const processedBy = req.body?.processedBy ?? "admin";

  const [pcr] = await db.select().from(pinChangeRequestsTable).where(eq(pinChangeRequestsTable.id, id));
  if (!pcr) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  await db.update(pinChangeRequestsTable).set({
    status: "approved",
    processedAt: new Date().toISOString(),
    processedBy,
  }).where(eq(pinChangeRequestsTable.id, id));

  await db.update(usersTable).set({ pin: pcr.pendingPin }).where(eq(usersTable.id, pcr.userId));

  res.json({ ok: true });
});

router.post("/pin-changes/:id/reject", async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { processedBy, rejectionReason } = req.body ?? {};

  const [pcr] = await db.select().from(pinChangeRequestsTable).where(eq(pinChangeRequestsTable.id, id));
  if (!pcr) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  await db.update(pinChangeRequestsTable).set({
    status: "rejected",
    processedAt: new Date().toISOString(),
    processedBy: processedBy ?? "admin",
    rejectionReason: rejectionReason ?? null,
  }).where(eq(pinChangeRequestsTable.id, id));

  res.json({ ok: true });
});

export default router;
