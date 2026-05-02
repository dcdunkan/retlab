import type { ExpandAttendanceSubjectCardsOption } from "$lib/types";
import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
	boolean,
	foreignKey,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	varchar
} from "drizzle-orm/pg-core";

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

export const staleProxyCache = pgTable("stale_proxy_cache", {
	key: varchar({ length: 64 }).primaryKey(),
	data: jsonb().notNull(),
	cachedAt: timestamp({ withTimezone: true }).notNull()
});

export const settings = pgTable(
	"settings",
	{
		accountUsername: text("account_username").notNull(),
		collegeId: integer("college_id").notNull(),

		// useful tweaks
		attendancePercentMin: integer("attendance_percent_min").default(75).notNull(),
		attendancePercentMax: integer("attendance_percent_max").default(90).notNull(),

		// fun tweaks
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

export const settingsRelations = relations(settings, (r) => ({
	account: r.one(accounts, {
		fields: [settings.collegeId, settings.accountUsername],
		references: [accounts.collegeId, accounts.username]
	})
}));

export type Settings = typeof settings.$inferSelect;

export const notificationServerSettings = pgTable(
	"notification_server_settings",
	{
		accountUsername: text("account_username").notNull(),
		collegeId: integer("college_id").notNull(),

		url: text().notNull(), // Notification server Url
		vapidKey: text().notNull(), // Vapid key used by the Ns, so that R can compare
		etlabAccessToken: text().notNull(), // Etlab access token that should be used by the proxied request
		apiKey: text().notNull(), // API key that must be used by the R to make request to Ns
		authToken: text().notNull() // Token that must be used by the Ns to make proxied request to R
	},
	(table) => [
		foreignKey({
			columns: [table.collegeId, table.accountUsername],
			foreignColumns: [accounts.collegeId, accounts.username],
			name: "notification_server_settings_college_id_account_username_fkey"
		})
			.onUpdate("cascade")
			.onDelete("cascade"),
		primaryKey({
			columns: [table.accountUsername, table.collegeId],
			name: "notification_server_settings_pkey"
		})
	]
);

export type NotificationServerSettings = typeof notificationServerSettings.$inferSelect;

export const notificationSettingsRelations = relations(notificationServerSettings, (r) => ({
	account: r.one(accounts, {
		fields: [notificationServerSettings.collegeId, notificationServerSettings.accountUsername],
		references: [accounts.collegeId, accounts.username]
	})
}));

export type SettingsState = Omit<Settings, "collegeId" | "accountUsername">;
export type NotificationServerSettingsState = Omit<
	NotificationServerSettings,
	"collegeId" | "accountUsername"
>;

// settings that's passed on to the client side.
export type ClientSettingsState = SettingsState;
export type ClientNotificationServerSettingsState = Omit<
	NotificationServerSettingsState,
	"etlabAccessToken" | "apiKey" | "authToken"
> | null;

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
	notificationServerSettings: r.one(notificationServerSettings),
	college: r.one(colleges, {
		fields: [accounts.collegeId],
		references: [colleges.id]
	})
}));
