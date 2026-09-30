import { zodStrictNumber } from "$lib";
import z from "zod";

const numberSchema = z.coerce.number();
const strictNumberSchema = zodStrictNumber(z.number());
const stringSchema = z.string().nonempty();

export const p = {
	num: (val: unknown): number => {
		if (val === "-") return 0;
		return strictNumberSchema.parse(val);
	},
	num0: (val: unknown): number => {
		if (val === "-") return 0;
		return numberSchema.parse(val);
	},
	str: (val: unknown): string => stringSchema.parse(val)
};

export class ParseError extends Error {
	constructor() {
		super("Failed to parse details.");
	}
}

function parseError() {
	throw new ParseError();
}

export function objectify(
	keys: string[],
	values: string[]
): {
	[k: string]: string;
} {
	if (keys.length !== values.length) throw new Error("Invalid input");
	return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}

export function strictColonSeparatedValueWithLabel(str: string, expectedLabel: string): string {
	const { label, value } = strictColonSeparated(str);
	if (label !== expectedLabel) parseError();
	return value;
}

export function strictColonSeparated(str: string): {
	label: string;
	value: string;
} {
	const index = str.indexOf(":");
	if (index === -1) parseError();
	return {
		label: str.slice(0, index).trim(),
		value: str.slice(index + 1).trim()
	};
}

export function strictParseResultLike(str: string): {
	numerator: number;
	denominator: number;
} {
	const slashIndex = str.indexOf("/");
	if (slashIndex === -1) parseError();
	const numerator = p.num(str.slice(0, slashIndex).trim());
	if (isNaN(numerator)) parseError();
	const denominator = p.num(str.slice(slashIndex + 1).trim());
	if (isNaN(denominator)) parseError();
	return { numerator, denominator };
}

/* 1/2 (50%) */
export function strictParseAttendanceLike(str: string): {
	numerator: number;
	denominator: number;
	percentValue: number;
} {
	const splits = str.split(" ").map((split) => split.trim());
	if (splits.length !== 2) parseError();
	const slashIndex = splits[0].indexOf("/");
	if (slashIndex === -1) parseError();
	const numerator = p.num(splits[0].slice(0, slashIndex).trim());
	if (isNaN(numerator)) parseError();
	const denominator = p.num(splits[0].slice(slashIndex + 1).trim());
	if (isNaN(denominator)) parseError();
	const percentIndex = splits[1].indexOf("%");
	if (percentIndex === -1) parseError();
	if (!splits[1].startsWith("(")) parseError();
	const percentValue = p.num(splits[1].slice(1, percentIndex).trim());
	if (isNaN(percentValue)) parseError();
	return { numerator, denominator, percentValue };
}

export function strictParseSubjectLineLike(str: string): {
	code: string;
	name: string;
} {
	const SEPARATOR = " - ";
	const hyphenIndex = str.indexOf(SEPARATOR);
	if (hyphenIndex === -1) parseError();
	return {
		code: str.slice(0, hyphenIndex).trim(),
		name: str.slice(hyphenIndex + SEPARATOR.length).trim()
	};
}
