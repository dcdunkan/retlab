import { CssAtRuleAST, CssGenericAtRuleAST, parse as parseCss } from "@adobe/css-tools";
import { default as assert } from "node:assert";
import * as fs from "node:fs/promises";
import postcssValueParser, { Dimension, default as parseCssValue } from "postcss-value-parser";

const REG = /var\(\s*--([-a-zA-Z]+)\s*\)/g;

const MAIN_STYLESHEET_PATH = "./src/app.css";
const TAILWIND_STYLESHEET_PATH = "./node_modules/tailwindcss/index.css";

// prettier-ignore
const DECLARATION_VALUE_CATEGORIES = [
	"font", "color", "spacing", "breakpoint", "container", "text", "tracking",
	"leading", "radius", "shadow", "inset", "drop", "ease", "animate", "blur",
	"perspective", "aspect", "default",
	/// non-standard
	"~var"
] as const;

type ParsedDeclaration = {
	type: DeclarationValueCategory;
	name?: string;
	rawValue: string;
};
type ParsedDeclarationMap = Record<string, ParsedDeclaration>;
type DeclarationValueCategory = (typeof DECLARATION_VALUE_CATEGORIES)[number];

type ParsedValue =
	| { type: "font"; name?: string; fonts: string[] }
	| { type: "spacing"; name?: string; value: string | Dimension }
	| { type: "color"; name?: string; value: string }
	| { type: "shadow"; name?: string; value: string }
	| { type: "radius"; name?: string; value: string | Dimension };

const outputFilepath = process.argv[2];
if (outputFilepath == null) throw new Error("error: provide output filepath");

const stylesheet = parseCss(await fs.readFile(MAIN_STYLESHEET_PATH, "utf-8")).stylesheet;
const tailwindsheet = parseCss(await fs.readFile(TAILWIND_STYLESHEET_PATH, "utf-8")).stylesheet;
const twThemeLayer = tailwindsheet.rules[1];
assert(
	twThemeLayer != null &&
		twThemeLayer.type === "layer" &&
		twThemeLayer.layer === "theme" &&
		twThemeLayer.rules != null
);
const twDefaultTheme = twThemeLayer.rules[0];
assert(
	twDefaultTheme.type === "at-rule" &&
		twDefaultTheme.name === "theme" &&
		twDefaultTheme.prelude === "default" &&
		twDefaultTheme.rules != null
);
const twVariables = parseTwTheme(twDefaultTheme.rules);

const RET_THEMES: {
	name: string;
	variants: {
		mode: "light" | "dark";
		selectors: string[];
		valueMap: Record<string, ParsedDeclaration>;
		resolvedMap: Record<string, ParsedDeclaration>;
		theme: Record<string, ParsedValue>;
	}[];
}[] = [
	{
		name: "Retman",
		variants: [
			{
				mode: "light",
				selectors: [":root"],
				valueMap: {},
				resolvedMap: {},
				theme: {}
			},
			{
				mode: "dark",
				selectors: [".dark"],
				valueMap: {},
				resolvedMap: {},
				theme: {}
			}
		]
	}
];

const retThemeDefinition = stylesheet.rules.find((child) => {
	return (
		child.type === "at-rule" &&
		child.name === "theme" &&
		child.prelude === "" &&
		child.rules != null
	);
});
if (
	retThemeDefinition == null ||
	retThemeDefinition.type !== "at-rule" ||
	retThemeDefinition.rules == null
)
	throw new Error("could not find ret theme definitions (inline theme)");

for (const theme of RET_THEMES) {
	for (const variant of theme.variants) {
		variant.valueMap = parseRetTheme(stylesheet.rules, variant.selectors, twVariables);
		const resolvedMap = parseTwTheme(
			retThemeDefinition.rules,
			mergedContext(twVariables, variant.valueMap)
		);
		variant.resolvedMap = resolvedMap;

		const theme: Record<string, ParsedValue> = {};

		for (const key in resolvedMap) {
			const resolved = resolvedMap[key];
			if (resolved.type === "~var") {
				console.error(resolved);
				console.error(resolvedMap);
				throw new Error("There are unresolved variables in this theme");
			} else {
				const parsed = parseCssValue(resolved.rawValue);

				let value: ParsedValue;

				if (resolved.type === "font") {
					const fonts: string[] = [];
					for (const node of parsed.nodes) {
						if (node.type === "string") {
							fonts.push(node.value);
						} else if (node.type === "word") {
							fonts.push(node.value);
						} else if (node.type === "div") {
							//
						} else {
							throw new Error("no idea");
						}
					}
					value = {
						type: "font",
						name: resolved.name,
						fonts: fonts
					};
				} else if (resolved.type === "spacing") {
					value = {
						type: "spacing",
						name: resolved.name,
						value: postcssValueParser.unit(resolved.rawValue) || resolved.rawValue
					};
				} else if (resolved.type === "color") {
					value = {
						type: "color",
						name: resolved.name,
						value: resolved.rawValue
					};
				} else if (resolved.type === "shadow") {
					value = {
						type: "shadow",
						name: resolved.name,
						value: resolved.rawValue
					};
				} else if (resolved.type === "radius") {
					value = {
						type: "radius",
						name: resolved.name,
						value: postcssValueParser.unit(resolved.rawValue) || resolved.rawValue
					};
				} else {
					console.log(resolved, parsed);
					throw new Error("some other unhandled type?");
				}
				theme[key] = value;
			}
		}

		variant.theme = theme;
	}
}

await fs.writeFile(outputFilepath, JSON.stringify(RET_THEMES), "utf-8");
console.log("written output to", outputFilepath);

// functions
function parseRetTheme(
	stylesheetRules: CssAtRuleAST[],
	selectors: string[],
	context: ParsedDeclarationMap
) {
	const theme = stylesheetRules.find((r) => {
		if (r.type !== "rule") return false;
		if (selectors.length !== r.selectors.length) return false;
		for (const [i, selector] of selectors.entries()) {
			if (r.selectors[i] !== selector) return false;
		}
		return true;
	});
	if (theme == null || theme.type !== "rule") {
		throw new Error("no theme matching the selector found in rules");
	}
	return theme.declarations.reduce((vars, rule) => {
		if (rule.type !== "declaration") return vars;
		if (!rule.property.startsWith("--"))
			throw new Error("expected ret theme decls to be variables");

		const withoutPrefix = rule.property.slice(2);
		const key = withoutPrefix;
		const value = resolveVars(rule.value.trim(), mergedContext(context, vars));

		vars[key] = {
			type: "~var",
			name: key,
			rawValue: value
		};
		return vars;
	}, {} as ParsedDeclarationMap);
}

function parseTwTheme(
	themeRules: NonNullable<CssGenericAtRuleAST["rules"]>,
	context?: ParsedDeclarationMap
): ParsedDeclarationMap {
	return themeRules.reduce((vars, rule) => {
		if (rule.type !== "declaration") return vars;
		if (!rule.property.startsWith("--")) throw new Error("expected theme decls to be variables");
		const withoutPrefix = rule.property.slice(2);
		const hyphenIndex = withoutPrefix.indexOf("-");
		const category = withoutPrefix.slice(0, hyphenIndex === -1 ? undefined : hyphenIndex);
		if (!isDeclarationValueCategory(category)) {
			console.log(rule);
			throw new Error("warning: no idea what that was");
		}

		const key = withoutPrefix;
		const value = resolveVars(rule.value.trim(), mergedContext(context, vars));
		const name = withoutPrefix.slice(category.length + 1).trim();

		vars[key] = {
			type: category,
			name: name === "" ? undefined : name,
			rawValue: value
		};
		return vars;
	}, {} as ParsedDeclarationMap);
}

function resolveVars(str: string, context?: ParsedDeclarationMap) {
	if (context == null) return str;

	let changed;
	do {
		changed = false;
		for (const match of str.matchAll(REG)) {
			if (match[1] in context) {
				str = str.replace(match[0], context[match[1]].rawValue);
				// console.log("replaced", match[0], "with", context[match[1]].value.value);
				changed = true;
			} else {
				console.warn("expected value to be found in context", str, match[1]);
			}
		}
	} while (changed);

	return str;
}

function mergedContext(...contexts: (ParsedDeclarationMap | undefined)[]): ParsedDeclarationMap {
	let merged: ParsedDeclarationMap = {};
	for (const context of contexts) merged = { ...merged, ...context };
	return merged;
}

function isDeclarationValueCategory(s: string): s is DeclarationValueCategory {
	return (DECLARATION_VALUE_CATEGORIES as unknown as string[]).includes(s);
}
