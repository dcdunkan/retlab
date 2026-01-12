import z from "zod";

export const settingsSchema = z
	.object({
		attendanceMinCutoff: z.int().min(0).max(100),
		attendanceMaxCutoff: z.int().min(0).max(100)
	})
	.strict();
