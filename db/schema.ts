import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const players = sqliteTable("players", { id: text("id").primaryKey(), username: text("username").notNull().unique(), name: text("name").notNull(), email: text("email") });
export const nights = sqliteTable("nights", { id: text("id").primaryKey(), host: text("host").notNull(), guest: text("guest").notNull(), status: text("status").notNull(), data: text("data").notNull(), created: text("created").notNull() });
