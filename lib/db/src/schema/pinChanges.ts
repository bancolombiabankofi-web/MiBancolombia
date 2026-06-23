import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const pinChangeRequestsTable = pgTable("pin_change_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentNumber: text("document_number").notNull(),
  userName: text("user_name").notNull(),
  requestedAt: text("requested_at").notNull(),
  status: text("status").notNull().default("pending"),
  pendingPin: text("pending_pin").notNull(),
  processedAt: text("processed_at"),
  processedBy: text("processed_by"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPinChangeRequestSchema = createInsertSchema(pinChangeRequestsTable).omit({ createdAt: true });
export type InsertPinChangeRequest = z.infer<typeof insertPinChangeRequestSchema>;
export type DbPinChangeRequest = typeof pinChangeRequestsTable.$inferSelect;
