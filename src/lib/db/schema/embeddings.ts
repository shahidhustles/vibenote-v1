import { pgTable, varchar, text, vector, index } from "drizzle-orm/pg-core";
import { resources } from "./resources";

export const embeddings = pgTable(
  "embeddings",
  {
    id: varchar("id", { length: 191 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    resourceId: varchar("resource_id", { length: 191 })
      .references(() => resources.id, { onDelete: "cascade" })
      .notNull(),
    userId: varchar("user_id", { length: 191 }).notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 384 }).notNull(), // Cohere embed-english-light-v3.0 uses 384 dimensions
  },
  (table) => ({
    embeddingIndex: index("embedding_index").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    userIdIndex: index("user_id_index").on(table.userId),
  })
);
