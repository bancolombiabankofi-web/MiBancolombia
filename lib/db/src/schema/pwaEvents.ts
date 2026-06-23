import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pwaInstallEventsTable = pgTable("pwa_install_events", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  platform: text("platform").notNull(),
  deviceInfo: text("device_info").notNull(),
  userId: text("user_id"),
  documentNumber: text("document_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPwaInstallEventSchema = createInsertSchema(pwaInstallEventsTable).omit({ createdAt: true });
export type InsertPwaInstallEvent = z.infer<typeof insertPwaInstallEventSchema>;
export type DbPwaInstallEvent = typeof pwaInstallEventsTable.$inferSelect;
