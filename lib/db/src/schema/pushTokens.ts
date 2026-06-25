import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pushTokensTable = pgTable("push_tokens", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull(),
  platform: text("platform").notNull().default("android"),
  deviceInfo: text("device_info").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPushTokenSchema = createInsertSchema(pushTokensTable).omit({ createdAt: true, updatedAt: true });
export type InsertPushToken = z.infer<typeof insertPushTokenSchema>;
export type DbPushToken = typeof pushTokensTable.$inferSelect;
