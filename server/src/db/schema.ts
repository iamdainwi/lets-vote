import { customType, pgTable, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";

const ipAddress = customType<{
    data: string;
    driverData: string;
    config: { length?: number }
}>({
    dataType(config) {
        return `inet`;
    },
});

export const pollsTable = pgTable("polls", {
    id: uuid("id").primaryKey().defaultRandom(),
    question: varchar("question", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const optionsTable = pgTable("options", {
    id: uuid("id").primaryKey().defaultRandom(),
    optionText: text("option_text").notNull(),
    pollId: uuid("poll_id").references(() => pollsTable.id, { onDelete: "cascade" }).notNull(),
});

export const votesTable = pgTable("votes", {
    id: uuid("id").primaryKey().defaultRandom(),
    optionId: uuid("option_id").references(() => optionsTable.id, { onDelete: "cascade" }).notNull(),
    voterIp: ipAddress("voter_ip").notNull(),
    votedAt: timestamp("voted_at").notNull().defaultNow(),
}, (table) => [
    unique("unique_voter_ip").on(table.optionId, table.voterIp),
]);