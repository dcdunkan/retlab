import { zodStrictNumber } from "$lib";
import z from "zod";

export const ONBOARDING_DATA_SCHEMA = z.object({
	displayName: z
		.string()
		.trim()
		.min(1, "Display name cannot be empty")
		.max(24, "Display name must be atmost 24 characters long")
		.regex(/^[a-zA-Z0-9 ]+$/u, "Display name contains invalid characters!"),
	semesterId: zodStrictNumber(z.int("Invalid semester")),
	attendancePercentMin: z.int("Invalid cutoff").min(0).max(99),
	attendancePercentMax: z.int("Invalid cutoff").min(0).max(99)
});
