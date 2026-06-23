import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, pwaInstallEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/pwa-events", async (_req, res): Promise<void> => {
  const rows = await db.select().from(pwaInstallEventsTable).orderBy(desc(pwaInstallEventsTable.createdAt)).limit(500);
  res.json(rows);
});

router.post("/pwa-events", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id) {
    res.status(400).json({ error: "id is required" });
    return;
  }
  const [row] = await db.insert(pwaInstallEventsTable).values(data).returning();
  res.status(201).json(row);
});

export default router;
