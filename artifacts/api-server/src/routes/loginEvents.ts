import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, loginEventsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/login-events", async (_req, res): Promise<void> => {
  const rows = await db.select().from(loginEventsTable).orderBy(desc(loginEventsTable.createdAt)).limit(2000);
  res.json(rows);
});

router.post("/login-events", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.documentNumber) {
    res.status(400).json({ error: "id and documentNumber are required" });
    return;
  }
  const [row] = await db.insert(loginEventsTable).values(data).returning();
  res.status(201).json(row);
});

export default router;
