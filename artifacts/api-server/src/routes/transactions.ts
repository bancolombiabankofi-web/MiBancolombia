import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/transactions", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const rows = userId
    ? await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId)).orderBy(desc(transactionsTable.createdAt))
    : await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt));
  res.json(rows);
});

router.post("/transactions", async (req, res): Promise<void> => {
  const data = req.body;
  if (!data?.id || !data?.userId || !data?.accountId) {
    res.status(400).json({ error: "id, userId, and accountId are required" });
    return;
  }
  const [tx] = await db.insert(transactionsTable).values(data).returning();
  res.status(201).json(tx);
});

export default router;
