import { jsonb, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const creatorStateTable = pgTable("creator_state", {
  id: serial("id").primaryKey(),
  state: jsonb("state").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCreatorStateSchema = createInsertSchema(creatorStateTable).omit({
  id: true,
  updatedAt: true,
});

export type InsertCreatorState = z.infer<typeof insertCreatorStateSchema>;
export type CreatorStateRow = typeof creatorStateTable.$inferSelect;