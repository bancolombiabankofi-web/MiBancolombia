import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loginEventsTable = pgTable("login_events", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  documentNumber: text("document_number").notNull(),
  userId: text("user_id"),
  success: boolean("success").notNull(),
  platform: text("platform").notNull(),
  deviceInfo: text("device_info").notNull(),
  ip: text("ip").notNull(),
  latitude: text("latitude").notNull().default(""),
  longitude: text("longitude").notNull().default(""),
  city: text("city").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLoginEventSchema = createInsertSchema(loginEventsTable).omit({ createdAt: true });
export type InsertLoginEvent = z.infer<typeof insertLoginEventSchema>;
export type DbLoginEvent = typeof loginEventsTable.$inferSelect;
