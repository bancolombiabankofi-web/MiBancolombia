import { pgTable, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notificationsLogTable = pgTable("notifications_log", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  color: text("color").notNull().default("#FDDA24"),
  channelId: text("channel_id").notNull().default("default"),
  targetType: text("target_type").notNull().default("all"),
  targetUserIds: jsonb("target_user_ids").$type<string[]>().notNull().default([]),
  sentCount: integer("sent_count").notNull().default(0),
  status: text("status").notNull().default("sent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertNotificationsLogSchema = createInsertSchema(notificationsLogTable).omit({ createdAt: true });
export type InsertNotificationsLog = z.infer<typeof insertNotificationsLogSchema>;
export type DbNotificationsLog = typeof notificationsLogTable.$inferSelect;
