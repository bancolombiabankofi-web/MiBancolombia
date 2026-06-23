import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { documentNumber, pin } = req.body ?? {};
  if (!documentNumber || !pin) {
    res.status(400).json({ error: "documentNumber and pin are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.documentNumber, String(documentNumber)));

  if (!user || user.pin !== String(pin)) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  if (user.status === "blocked") {
    res.status(403).json({ error: "blocked" });
    return;
  }

  res.json({ user });
});

export default router;
