import {
	pgTable,
	integer,
	text,
	foreignKey,
	timestamp,
	primaryKey,
	boolean,
	pgEnum
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { ExpandAttendanceSubjectCardsOption } from "$lib/types";

export const deviceType = pgEnum("DeviceType", ["LAPTOP", "MOBILE", "UNKNOWN"]);

export type DeviceType = (typeof deviceType.enumValues)[number];

export const colleges = pgTable("colleges", {
	id: integer().primaryKey().notNull(),
	name: text().notNull(),
	baseUrl: text("base_url").notNull()
});

export type College = typeof colleges.$inferSelect;

export const collegesRelations = relations(colleges, (r) => ({
	accounts: r.many(accounts)
}));

export const sessions = pgTable(
	"sessions",
	{
		id: text()
			.primaryKey()
			.notNull()
			.$defaultFn(() => createId()),
		accessToken: text("access_token").notNull(),
		deviceType: deviceType("device_type").notNull(),
		deviceInfo: text("device_info"),
		createdAt: timestamp("created_at", { mode: "date" })
			.default(sql`now()`)
			.notNull(),
		accountUsername: text("account_username").notNull(),
		collegeId: integer("college_id").notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.collegeId, table.accountUsername],
			foreignColumns: [accounts.collegeId, accounts.username],
			name: "sessions_college_id_account_username_fkey"
		})
			.onUpdate("cascade")
			.onDelete("cascade")
	]
);

export type Session = typeof sessions.$inferSelect;

export const sessionsRelations = relations(sessions, (r) => ({
	account: r.one(accounts, {
		fields: [sessions.collegeId, sessions.accountUsername],
		references: [accounts.collegeId, accounts.username]
	})
}));

export const settings = pgTable(
	"settings",
	{
		accountUsername: text("account_username").notNull(),
		collegeId: integer("college_id").notNull(),
		attendancePercentMin: integer("attendance_percent_min").default(75).notNull(),
		attendancePercentMax: integer("attendance_percent_max").default(90).notNull(),
		expandAttendanceSubjects: text("expand_attendance_subjects")
			.default("critical")
			.$type<ExpandAttendanceSubjectCardsOption>()
			.notNull(),
		invalidAttendanceMarker: text("invalid_attendance_marker")
			.$type<"double-hyphen" | "single-hyphen" | "mdash" | "ndash">()
			.default("double-hyphen")
			.notNull(),
		showAttendanceBarByDefault: boolean("show_attendance_bar_by_default").default(false).notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.collegeId, table.accountUsername],
			foreignColumns: [accounts.collegeId, accounts.username],
			name: "settings_college_id_account_username_fkey"
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		primaryKey({ columns: [table.accountUsername, table.collegeId], name: "settings_pkey" })
	]
);

export type Settings = typeof settings.$inferSelect;
export type SettingsState = Omit<typeof settings.$inferSelect, "accountUsername" | "collegeId">;

export const settingsRelations = relations(settings, (r) => ({
	account: r.one(accounts, {
		fields: [settings.collegeId, settings.accountUsername],
		references: [accounts.collegeId, accounts.username]
	})
}));

export const accounts = pgTable(
	"accounts",
	{
		collegeId: integer("college_id").notNull(),
		username: text().notNull(),
		batchId: integer("batch_id").notNull(),
		courseName: text("course_name").notNull(),
		imageUrl: text("image_url").notNull(),
		lastUpdatedAt: timestamp("last_updated_at", { mode: "date" }).notNull(),
		profileName: text("profile_name").notNull(),
		regNo: text("reg_no").notNull(),
		rollNo: text("roll_no").notNull(),
		semesterId: integer("semester_id").notNull(),
		semesterName: text("semester_name").notNull(),
		studentId: integer("student_id").notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.collegeId],
			foreignColumns: [colleges.id],
			name: "accounts_college_id_fkey"
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		primaryKey({ columns: [table.collegeId, table.username], name: "accounts_pkey" })
	]
);

export type Account = typeof accounts.$inferSelect;

export const accountsRelations = relations(accounts, (r) => ({
	sessions: r.many(sessions),
	settings: r.one(settings),
	college: r.one(colleges, {
		fields: [accounts.collegeId],
		references: [colleges.id]
	})
}));
