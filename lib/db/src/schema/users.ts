import { pgTable, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  documentType: text("document_type").notNull(),
  documentNumber: text("document_number").notNull(),
  countryResidence: text("country_residence").notNull(),
  countryBirth: text("country_birth").notNull(),
  currencyCode: text("currency_code").notNull(),
  currencySymbol: text("currency_symbol").notNull(),
  firstName: text("first_name").notNull(),
  secondName: text("second_name").notNull().default(""),
  lastName: text("last_name").notNull(),
  secondLastName: text("second_last_name").notNull().default(""),
  birthDate: text("birth_date").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  pin: text("pin").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  status: text("status").notNull().default("active"),
  address: text("address"),
  motherName: text("mother_name"),
  motherPhone: text("mother_phone"),
  googleEmail: text("google_email"),
  suspensionReason: text("suspension_reason"),
  suspensionDate: text("suspension_date"),
  requiredDocuments: jsonb("required_documents").$type<string[]>(),
  unblockSteps: jsonb("unblock_steps").$type<any[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
