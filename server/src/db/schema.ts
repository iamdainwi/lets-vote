import { pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

// Polls table — uses the same nanoid string as the Redis key
export const pollsTable = pgTable("polls", {
    id: text("id").primaryKey(),
    question: varchar("question", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// Options table — uses the same nanoid string as the Redis option id
export const optionsTable = pgTable("options", {
    id: text("id").primaryKey(),
    optionText: text("option_text").notNull(),
    pollId: text("poll_id")
        .references(() => pollsTable.id, { onDelete: "cascade" })
        .notNull(),
});

// Votes table — stores each individual vote as a permanent audit record
export const votesTable = pgTable("votes", {
    id: text("id").primaryKey(),          // nanoid at insert time
    optionId: text("option_id")
        .references(() => optionsTable.id, { onDelete: "cascade" })
        .notNull(),
    pollId: text("poll_id")
        .references(() => pollsTable.id, { onDelete: "cascade" })
        .notNull(),
    voterId: text("voter_id").notNull(),  // UUID from the client's localStorage
    votedAt: timestamp("voted_at").notNull().defaultNow(),
}, (table) => [
    unique("unique_voter_per_poll").on(table.pollId, table.voterId),
]);