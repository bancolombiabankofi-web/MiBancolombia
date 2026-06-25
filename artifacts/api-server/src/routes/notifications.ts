import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import { db, pushTokensTable, notificationsLogTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

/* ─────────────────────────────────────────
   PUSH TOKEN REGISTRATION
   Called by the APK on every login.
   POST /api/push-tokens
   Body: { userId, token, platform, deviceInfo }
───────────────────────────────────────── */
router.post("/push-tokens", async (req, res): Promise<void> => {
  const { userId, token, platform = "android", deviceInfo = "" } = req.body ?? {};

  if (!userId || !token) {
    res.status(400).json({ error: "userId and token are required" });
    return;
  }

  const existing = await db
    .select({ id: pushTokensTable.id })
    .from(pushTokensTable)
    .where(eq(pushTokensTable.token, token));

  if (existing.length > 0) {
    await db
      .update(pushTokensTable)
      .set({ userId, platform, deviceInfo, updatedAt: new Date() })
      .where(eq(pushTokensTable.token, token));
    res.json({ ok: true, action: "updated" });
    return;
  }

  await db.insert(pushTokensTable).values({
    id: randomUUID(),
    userId,
    token,
    platform,
    deviceInfo,
  });
  res.status(201).json({ ok: true, action: "created" });
});

/* ─────────────────────────────────────────
   LIST TOKENS (admin)
   GET /api/push-tokens?userId=
───────────────────────────────────────── */
router.get("/push-tokens", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  const rows = userId
    ? await db.select().from(pushTokensTable).where(eq(pushTokensTable.userId, userId))
    : await db.select().from(pushTokensTable).orderBy(pushTokensTable.createdAt);
  res.json(rows);
});

/* ─────────────────────────────────────────
   SEND NOTIFICATION (admin)
   POST /api/notifications/send
   Body: {
     adminId: string,
     title: string,
     body: string,
     color: string,           // hex color, e.g. "#10B981"
     channelId: string,       // android channel: "default"|"banking"|"security"|"account"|"documents"
     targetType: "all"|"users",
     targetUserIds: string[], // required when targetType = "users"
     data?: Record<string,unknown>
   }
───────────────────────────────────────── */
router.post("/notifications/send", async (req, res): Promise<void> => {
  const {
    adminId,
    title,
    body,
    color = "#FDDA24",
    channelId = "default",
    targetType = "all",
    targetUserIds = [],
    data = {},
  } = req.body ?? {};

  if (!adminId || !title || !body) {
    res.status(400).json({ error: "adminId, title, and body are required" });
    return;
  }

  /* 1. Fetch relevant tokens */
  let tokens: { token: string; userId: string }[] = [];
  if (targetType === "all") {
    tokens = await db
      .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
      .from(pushTokensTable);
  } else if (targetType === "users" && targetUserIds.length > 0) {
    tokens = await db
      .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, targetUserIds));
  }

  /* 2. Call Expo Push API */
  let expoPushResponse: unknown = null;
  let sentCount = 0;

  if (tokens.length > 0) {
    const messages = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: { ...data, color, channelId },
      sound: "default",
      priority: "high",
      channelId,
      color,
    }));

    try {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });
      expoPushResponse = await response.json();
      sentCount = tokens.length;
    } catch (err) {
      expoPushResponse = { error: String(err) };
    }
  }

  /* 3. Log the notification */
  const logId = randomUUID();
  await db.insert(notificationsLogTable).values({
    id: logId,
    adminId,
    title,
    body,
    color,
    channelId,
    targetType,
    targetUserIds: targetType === "all" ? [] : targetUserIds,
    sentCount,
    status: "sent",
  });

  res.json({
    ok: true,
    sentCount,
    logId,
    tokensFound: tokens.length,
    expoResponse: expoPushResponse,
  });
});

/* ─────────────────────────────────────────
   NOTIFICATIONS HISTORY (admin)
   GET /api/notifications/log
───────────────────────────────────────── */
router.get("/notifications/log", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(notificationsLogTable)
    .orderBy(notificationsLogTable.createdAt)
    .limit(200);
  res.json(rows.reverse());
});

export default router;
