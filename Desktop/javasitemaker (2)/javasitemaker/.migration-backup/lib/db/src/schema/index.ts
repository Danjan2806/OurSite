import { pgTable, text, serial, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  plan: text("plan").notNull().default("free"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettingsTable = pgTable("user_settings", {
  userId: varchar("user_id", { length: 64 }).primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("dark"),
  notifications: boolean("notifications").notNull().default(true),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  avatarUrl: text("avatar_url"),
  dbAccessLocked: boolean("db_access_locked").notNull().default(false),
  dbLockReason: text("db_lock_reason"),
  seoSettings: text("seo_settings").notNull().default("{}"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sitesTable = pgTable("sites", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull(),
  businessType: text("business_type").notNull(),
  status: text("status").notNull().default("DRAFT"),
  publishedUrl: text("published_url"),
  globalStyles: text("global_styles").notNull().default("{}"),
  frozen: boolean("frozen").notNull().default(false),
  frozenReason: text("frozen_reason"),
  frozenBy: varchar("frozen_by", { length: 64 }),
  frozenAt: timestamp("frozen_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pagesTable = pgTable("pages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  siteId: varchar("site_id", { length: 64 }).notNull().references(() => sitesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Главная"),
  slug: text("slug").notNull().default("index"),
  position: integer("position").notNull().default(0),
  meta: text("meta").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const formSubmissionsTable = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id", { length: 64 }).notNull().references(() => sitesTable.id, { onDelete: "cascade" }),
  blockId: varchar("block_id", { length: 64 }),
  formTitle: text("form_title").notNull().default("Заявка"),
  data: text("data").notNull().default("{}"),
  submitterIp: text("submitter_ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blocksTable = pgTable("blocks", {
  id: varchar("id", { length: 64 }).primaryKey(),
  siteId: varchar("site_id", { length: 64 }).notNull().references(() => sitesTable.id, { onDelete: "cascade" }),
  pageId: varchar("page_id", { length: 64 }).references(() => pagesTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  position: integer("position").notNull().default(0),
  rowId: text("row_id"),
  content: text("content").notNull().default("{}"),
  styles: text("styles").notNull().default("{}"),
  visible: boolean("visible").notNull().default(true),
  width: integer("width").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const siteAnalyticsTable = pgTable("site_analytics", {
  id: serial("id").primaryKey(),
  siteId: varchar("site_id", { length: 64 }).notNull().references(() => sitesTable.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  views: integer("views").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  uniqueVisitors: integer("unique_visitors").notNull().default(0),
  newRegistrations: integer("new_registrations").notNull().default(0),
  avgSessionSec: integer("avg_session_sec").notNull().default(0),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("info"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  fromUserId: varchar("from_user_id", { length: 64 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id", { length: 64 }).notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  message: text("message").notNull().default(""),
  imageUrl: text("image_url"),
  ticketId: varchar("ticket_id", { length: 32 }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof usersTable.$inferSelect;
export type Site = typeof sitesTable.$inferSelect;
export type Block = typeof blocksTable.$inferSelect;
export type Page = typeof pagesTable.$inferSelect;
export type UserSettings = typeof userSettingsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type FormSubmission = typeof formSubmissionsTable.$inferSelect;
