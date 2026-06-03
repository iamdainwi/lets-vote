import { pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

export const pollsTable = pgTable("polls", {
    id: text("id").primaryKey(),
    question: varchar("question", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const optionsTable = pgTable("options", {
    id: text("id").primaryKey(),
    optionText: text("option_text").notNull(),
    pollId: text("poll_id")
        .references(() => pollsTable.id, { onDelete: "cascade" })
        .notNull(),
});

export const votesTable = pgTable("votes", {
    id: text("id").primaryKey(),
    optionId: text("option_id")
        .references(() => optionsTable.id, { onDelete: "cascade" })
        .notNull(),
    pollId: text("poll_id")
        .references(() => pollsTable.id, { onDelete: "cascade" })
        .notNull(),
    voterId: text("voter_id").notNull(),
    votedAt: timestamp("voted_at").notNull().defaultNow(),
}, (table) => [
    unique("unique_voter_per_poll").on(table.pollId, table.voterId),
]);