import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const appNotificationsInboxTable = pgTable("app_notifications_inbox", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  color: text("color").default("#FDDA24"),
  type: text("type").default("info"),
  sentBy: text("sent_by").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});
