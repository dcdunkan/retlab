import z from "zod";

export const settingsSchema = z
	.object({
		attendanceMinCutoff: z.int().min(0).max(99),
		attendanceMaxCutoff: z.int().min(0).max(99),
		expandAttendanceSubjects: z.enum(["none", "critical", "all"]),
		invalidAttendanceMarker: z.enum(["double-hyphen", "ndash", "mdash", "single-hyphen"]),
		showAttendanceBarByDefault: z.boolean()
	})
	.strict();
