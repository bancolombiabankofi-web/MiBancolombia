import { pgTable, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cardsTable = pgTable("cards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  number: text("number").notNull(),
  expiry: text("expiry").notNull(),
  holder: text("holder").notNull(),
  brand: text("brand").notNull(),
  balance: integer("balance").notNull().default(0),
  limit: integer("limit"),
  color: text("color").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCardSchema = createInsertSchema(cardsTable).omit({ createdAt: true });
export type InsertCard = z.infer<typeof insertCardSchema>;
export type DbCard = typeof cardsTable.$inferSelect;
