import * as cheerio from "cheerio";
import { readFile } from "node:fs/promises";
import z from "zod";

const numberSchema = z.coerce.number();
const strictNumberSchema = z
	.string()
	.transform((value) => (value === "" ? null : value))
	.refine((value) => value === null || !isNaN(Number(value)))
	.transform((value) => (value === null ? null : Number(value)))
	.pipe(z.number());

const stringSchema = z.string().nonempty();

const num = (val: unknown): number => strictNumberSchema.parse(val);
const num0 = (val: unknown): number => numberSchema.parse(val);
const str = (val: unknown): string => stringSchema.parse(val);

const text = await readFile("./academic-analysis-html.txt", "utf-8");
parseAcademicAnalysisPage(text);

function parseError(): never {
	throw new Error("Parse error");
}

function parseAcademicAnalysisPage(htmlContent: string): Semester[] {
	try {
		const $ = cheerio.load(htmlContent, { scriptingEnabled: false });

		const initial: {
			head: string[];
			table: {
				data: string[];
				series: string[][];
			}[];
		}[] = [];

		for (const semester of $("button.accordion")) {
			const head = $(semester)
				.find("table")
				.first()
				.find("th")
				.map((_, cell) => $(cell).text().trim())
				.get();

			if (initial.length !== 0 && head.length !== initial[initial.length - 1].head.length)
				parseError();

			const detailsTable = $(semester).next("div.panel").find("table.mytable").get(0);
			if (detailsTable == null) {
				// note: i don't think it should be an error?
				initial.push({ head: head, table: [] });
				continue;
			}

			const mainTable: {
				data: string[];
				series: string[][];
			}[] = $(detailsTable)
				.find("tr")
				.not(".series-row")
				.toArray()
				.map((tr) => {
					const cells = $(tr)
						.children("th,td")
						.map((_, cell) => $(cell).text().trim())
						.get();

					const seriesRow = $(tr).next("tr");
					if (!seriesRow.hasClass("series-row")) return { data: cells, series: [] };

					const series: string[][] = seriesRow
						.find("div.rTableRow")
						.toArray()
						.map((row) =>
							$(row)
								.children("div.rTableHead, div.rTableCell")
								.map((_, cell) => $(cell).text().trim())
								.get()
						);
					return { data: cells, series };
				});

			initial.push({ head: head, table: mainTable });
		}

		// cleaning up of initial
		const parsed: Semester[] = [];

		for (const semesteri of initial) {
			const parsedTotalAttendance = strictParseAttendanceLike(
				strictColonSeparated(semesteri.head[1]).value
			);
			const parsedSemester: Semester = {
				semester: str(semesteri.head[0].trim()),
				totalAttendance: {
					attended: parsedTotalAttendance.numerator,
					classes: parsedTotalAttendance.denominator
				},
				sgpa: num(strictColonSeparatedValueWithLabel(semesteri.head[2], "SGPA")),
				earnedCredits: num(strictColonSeparatedValueWithLabel(semesteri.head[3], "Earned Credit")),
				cumulativeCredit: num(
					strictColonSeparatedValueWithLabel(semesteri.head[4], "Cumulative Credit")
				),
				cgpa: num(strictColonSeparatedValueWithLabel(semesteri.head[5], "CGPA")),
				result: str(strictColonSeparatedValueWithLabel(semesteri.head[6], "Result")),
				subjects: []
			};
			parsed.push(parsedSemester);

			if (semesteri.table.length < 2) {
				continue; // note: not an error right? <= subject head + subjects < 2 meaning that there is no subject data
			}
			const subjectHead = semesteri.table[0];
			for (const subjecti of semesteri.table.slice(1)) {
				const subjectRobj = objectify(subjectHead.data, subjecti.data);

				const parsedAttendance = strictParseAttendanceLike(subjectRobj["Attendance"]);
				const parsedSubjectLine = strictParseSubjectLineLike(subjectRobj["Subject"]);
				const parsedSubject: SemesterSubject = {
					gpa: num(subjectRobj["GPA"]),
					earnedCredits: num0(subjectRobj["Earned Credit"]),
					internalMarks: num(subjectRobj["Internal Marks"]),
					chances: num(subjectRobj["Chance"]),
					attendance: {
						attended: parsedAttendance.numerator,
						classes: parsedAttendance.denominator
					},
					code: str(parsedSubjectLine.code),
					name: str(parsedSubjectLine.name),
					grade: str(subjectRobj["Grade"]),
					result: str(subjectRobj["Result"]),
					seriesExams: []
				};
				parsedSemester.subjects.push(parsedSubject);

				if (subjecti.series.length < 2) {
					continue; // note: not an error right? <= series head + series < 2 meaning that there is no series data
				}
				const seriesHead = subjecti.series[0];
				for (const seriesi of subjecti.series.slice(1)) {
					const seriesRobj = objectify(seriesHead, seriesi);
					const parsedMarks = strictParseResultLike(seriesRobj["Marks"]);
					const parsedClassAvg = strictParseResultLike(seriesRobj["Class Avg."]);
					const parsedSeriesExam: SemesterSubjectSeriesExam = {
						slNo: num(seriesRobj["Sl.No."]),
						name: str(seriesRobj["Exam"]),
						subject: str(seriesRobj["Subject"]),
						marks: {
							obtained: parsedMarks.numerator,
							max: parsedMarks.denominator
						},
						classAverage: {
							obtained: parsedClassAvg.numerator,
							max: parsedClassAvg.denominator
						},
						classRank: num(seriesRobj["Class Rank"])
					};
					parsedSubject.seriesExams.push(parsedSeriesExam);
				}
			}
		}
		return parsed;
	} catch {
		parseError();
	}
}

function objectify(
	keys: string[],
	values: string[]
): {
	[k: string]: string;
} {
	if (keys.length !== values.length) throw new Error("Invalid input");
	return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}

function strictColonSeparatedValueWithLabel(str: string, expectedLabel: string): string {
	const { label, value } = strictColonSeparated(str);
	if (label !== expectedLabel) parseError();
	return value;
}

function strictColonSeparated(str: string): {
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

function strictParseResultLike(str: string): {
	numerator: number;
	denominator: number;
} {
	const slashIndex = str.indexOf("/");
	if (slashIndex === -1) parseError();
	const numerator = num(str.slice(0, slashIndex).trim());
	if (isNaN(numerator)) parseError();
	const denominator = num(str.slice(slashIndex + 1).trim());
	if (isNaN(denominator)) parseError();
	return { numerator, denominator };
}

/* 1/2 (50%) */
function strictParseAttendanceLike(str: string): {
	numerator: number;
	denominator: number;
	percentValue: number;
} {
	const splits = str.split(" ").map((split) => split.trim());
	if (splits.length !== 2) parseError();
	const slashIndex = splits[0].indexOf("/");
	if (slashIndex === -1) parseError();
	const numerator = num(splits[0].slice(0, slashIndex).trim());
	if (isNaN(numerator)) parseError();
	const denominator = num(splits[0].slice(slashIndex + 1).trim());
	if (isNaN(denominator)) parseError();
	const percentIndex = splits[1].indexOf("%");
	if (percentIndex === -1) parseError();
	if (!splits[1].startsWith("(")) parseError();
	const percentValue = num(splits[1].slice(1, percentIndex).trim());
	if (isNaN(percentValue)) parseError();
	return { numerator, denominator, percentValue };
}

function strictParseSubjectLineLike(str: string): {
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

type Semester = {
	semester: string;
	totalAttendance: {
		attended: number;
		classes: number;
		// percentage: number; // calculate by ourselves
	};
	sgpa: number;
	earnedCredits: number;
	cumulativeCredit: number;
	cgpa: number;
	result: string; // "PASSED". todo: find out what else.
	subjects: SemesterSubject[];
};

type SemesterSubject = {
	code: string;
	name: string;
	attendance: {
		attended: number;
		classes: number;
		// percentage: number;
	};
	internalMarks: number;
	grade: string;
	earnedCredits: number;
	result: string; // "PASSED" todo
	chances: number;
	gpa: number;
	seriesExams: SemesterSubjectSeriesExam[];
};

type SemesterSubjectSeriesExam = {
	slNo: number;
	name: string;
	subject: string;
	marks: {
		obtained: number;
		max: number;
	};
	classAverage: {
		obtained: number;
		max: number;
	};
	classRank: number;
};
