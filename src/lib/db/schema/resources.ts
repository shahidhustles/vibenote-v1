import { pgTable, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const resources = pgTable("resources", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: varchar("user_id", { length: 191 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResourceSchema = z.object({
  content: z.string().min(1, "Content is required"),
  userId: z.string().min(1, "User ID is required"),
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;
