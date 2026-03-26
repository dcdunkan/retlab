import z from "zod";

export const settingsSchema = z
	.object({
		attendancePercentMin: z.int().min(0).max(99),
		attendancePercentMax: z.int().min(0).max(99),
		expandAttendanceSubjects: z.enum([
			"none",
			"all",
			"critical",
			"barely-safe",
			"below-excellence"
		]),
		invalidAttendanceMarker: z.enum(["double-hyphen", "ndash", "mdash", "single-hyphen"]),
		showAttendanceBarByDefault: z.boolean()
	})
	.strict();
