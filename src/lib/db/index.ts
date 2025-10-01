import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/resources";
import * as embeddingsSchema from "./schema/embeddings";

// Disable prefetch as it's not supported for "Transaction" pool mode
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, {
  schema: {
    ...schema,
    ...embeddingsSchema,
  },
});
