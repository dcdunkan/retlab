import * as fs from "node:fs/promises";
import z from "zod";

// prettier-ignore
const DECLARATION_VALUE_CATEGORIES = [
	"font", "color", "spacing", "breakpoint", "container", "text", "tracking",
	"leading", "radius", "shadow", "inset", "drop", "ease", "animate", "blur",
	"perspective", "aspect", "default",
	/// non-standard
	"~var"
] as const;

const THEME_DATA_DECLARATION_SCHEMA = z.object({
	type: z.enum(DECLARATION_VALUE_CATEGORIES),
	name: z.string().min(1).optional(),
	rawValue: z.string().min(1)
});

const baseValue = z.object({
	name: z.string().min(1).optional()
});

const numericValue = z.union([
	z.string().min(1),
	z.object({ number: z.coerce.number(), unit: z.string().min(1) })
]);

const THEME_VALUES_DECLARATION_SCHEMA = z.discriminatedUnion("type", [
	baseValue.extend({
		type: z.literal("font"),
		fonts: z.array(z.string().min(1)).min(1)
	}),
	baseValue.extend({
		type: z.literal("spacing"),
		value: numericValue
	}),
	baseValue.extend({
		type: z.literal("color"),
		value: z.string().min(1)
	}),
	baseValue.extend({
		type: z.literal("shadow"),
		value: z.string().min(1)
	}),
	baseValue.extend({
		type: z.literal("radius"),
		value: numericValue
	})
]);

export type ThemeDeclaration = z.output<typeof THEME_VALUES_DECLARATION_SCHEMA>;

const GENERATED_THEME_DATA_SCHEMA = z.array(
	z.object({
		name: z.string().min(1),
		variants: z.array(
			z.object({
				mode: z.enum(["light", "dark"]),
				selectors: z.array(z.string().min(1)).min(1),
				valueMap: z.record(z.string(), THEME_DATA_DECLARATION_SCHEMA),
				resolvedMap: z.record(z.string(), THEME_DATA_DECLARATION_SCHEMA),
				theme: z.record(z.string(), THEME_VALUES_DECLARATION_SCHEMA)
			})
		)
	})
);

export const load = async () => {
	const content = JSON.parse(await fs.readFile("./resources/generated-theme-data.json", "utf-8"));

	return {
		themes: GENERATED_THEME_DATA_SCHEMA.parse(content)
	};
};

export const prerender = true;
