import { Router, type IRouter } from "express";
import { eq, or, isNull, and } from "drizzle-orm";
import { db, appNotificationsInboxTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

/* ─────────────────────────────────────────
   GET /api/app-notifications?userId=&unread=true
   Fetch in-app notifications for a user.
───────────────────────────────────────── */
router.get("/app-notifications", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const unreadOnly = req.query.unread === "true";

  if (!userId) {
    const all = await db
      .select()
      .from(appNotificationsInboxTable)
      .orderBy(appNotificationsInboxTable.createdAt);
    res.json(all.reverse());
    return;
  }

  const baseCondition = or(
    eq(appNotificationsInboxTable.userId, userId),
    isNull(appNotificationsInboxTable.userId)
  );

  const rows = await db
    .select()
    .from(appNotificationsInboxTable)
    .where(
      unreadOnly
        ? and(baseCondition, eq(appNotificationsInboxTable.isRead, false))
        : baseCondition
    )
    .orderBy(appNotificationsInboxTable.createdAt);

  res.json(rows.reverse());
});

/* ─────────────────────────────────────────
   POST /api/app-notifications/send
   Admin sends an in-app notification.
   Body: { adminId, title, body, color, type, targetType, targetUserIds }
───────────────────────────────────────── */
router.post("/app-notifications/send", async (req, res): Promise<void> => {
  const {
    adminId,
    title,
    body,
    color = "#FDDA24",
    type = "info",
    targetType = "all",
    targetUserIds = [],
  } = req.body ?? {};

  if (!adminId || !title || !body) {
    res.status(400).json({ error: "adminId, title, and body are required" });
    return;
  }

  if (targetType === "all") {
    await db.insert(appNotificationsInboxTable).values({
      id: randomUUID(),
      userId: null,
      title,
      body,
      color,
      type,
      sentBy: adminId,
    });
    res.json({ ok: true, count: 1, broadcast: true });
    return;
  }

  if (!targetUserIds.length) {
    res.status(400).json({ error: "targetUserIds required for targetType=users" });
    return;
  }

  const rows = targetUserIds.map((uid: string) => ({
    id: randomUUID(),
    userId: uid,
    title,
    body,
    color,
    type,
    sentBy: adminId,
  }));

  await db.insert(appNotificationsInboxTable).values(rows);
  res.json({ ok: true, count: rows.length, broadcast: false });
});

/* ─────────────────────────────────────────
   PUT /api/app-notifications/:id/read
   Mark a notification as read.
───────────────────────────────────────── */
router.put("/app-notifications/:id/read", async (req, res): Promise<void> => {
  const { id } = req.params;
  await db
    .update(appNotificationsInboxTable)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(appNotificationsInboxTable.id, id));
  res.json({ ok: true });
});

/* ─────────────────────────────────────────
   DELETE /api/app-notifications/:id
   Admin deletes a notification.
───────────────────────────────────────── */
router.delete("/app-notifications/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  await db
    .delete(appNotificationsInboxTable)
    .where(eq(appNotificationsInboxTable.id, id));
  res.json({ ok: true });
});

export default router;
