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

export const notificationServerSchema = z.object({
	accountPassword: z
		.string({
			error: "Password is required"
		})
		.nonempty({ error: "Password cannot be empty" })
		.max(256, { error: "Password seems tooo long" }),
	serverUrl: z.httpUrl({ error: "Must be a valid HTTP URL" })
});

const idType = z.string().nonempty().max(128);
const nameType = z.string().trim().min(3).max(128);
const descriptionType = z.string().trim().max(512);
const baseConfigOption = z.object({
	name: nameType,
	description: descriptionType.nonempty()
});
const configOption = z.discriminatedUnion("type", [
	// baseConfigOption.extend({
	// 	type: z.literal("string"),
	// 	defaultValue: z.string()
	// }),
	baseConfigOption.extend({
		type: z.literal("integer"),
		defaultValue: z.int(),
		min: z.int().optional(),
		max: z.int().optional()
	}),
	baseConfigOption.extend({
		type: z.literal("boolean"),
		defaultValue: z.boolean()
	})
	// baseConfigOption.extend({
	// 	type: z.literal("integer-range"),
	// 	defaultValue: z.tuple([z.int(), z.int()])
	// })
]);
export const serverConfigSchema = z.object({
	serverConfig: z.object({
		version: z.int().positive(),
		contact: z.url({ protocol: /^(https|mailto)$/ }),
		channels: z.record(
			idType,
			z.object({
				name: nameType,
				description: descriptionType.optional(),
				items: z.record(
					idType,
					z.object({
						name: nameType,
						description: descriptionType.nonempty(),
						active: z.boolean()
					})
				)
			})
		),
		config: z.record(z.string(), configOption)
	}),
	subscribedChannels: z.record(idType, z.array(idType)),
	overriddenConfig: z.record(idType, z.union(configOption.options.map((o) => o.shape.defaultValue)))
});
