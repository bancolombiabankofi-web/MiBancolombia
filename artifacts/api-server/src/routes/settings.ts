import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, appSettingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/settings", async (_req, res): Promise<void> => {
  const rows = await db.select().from(appSettingsTable);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  res.json(out);
});

router.put("/settings/:key", async (req, res): Promise<void> => {
  const key = Array.isArray(req.params.key) ? req.params.key[0] : req.params.key;
  const { value } = req.body ?? {};
  if (value == null) {
    res.status(400).json({ error: "value is required" });
    return;
  }
  await db.insert(appSettingsTable).values({ key, value: String(value) })
    .onConflictDoUpdate({ target: appSettingsTable.key, set: { value: String(value) } });
  res.json({ key, value: String(value) });
});

export default router;
