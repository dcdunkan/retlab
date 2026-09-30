import * as cheerio from "cheerio";
import {
	objectify,
	p,
	ParseError,
	strictColonSeparated,
	strictColonSeparatedValueWithLabel,
	strictParseAttendanceLike,
	strictParseResultLike,
	strictParseSubjectLineLike
} from "./helpers";
import type { Weblab } from "./types";

export function parseAcademicAnalysisPage(htmlContent: string): Weblab.AcademicAnalysis.Semester[] {
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
				throw new ParseError();

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
		const parsed: Weblab.AcademicAnalysis.Semester[] = [];

		for (const semesteri of initial) {
			const parsedTotalAttendance = strictParseAttendanceLike(
				strictColonSeparated(semesteri.head[1]).value
			);
			const parsedSemester: Weblab.AcademicAnalysis.Semester = {
				semester: p.str(semesteri.head[0].trim()),
				totalAttendance: {
					attended: parsedTotalAttendance.numerator,
					classes: parsedTotalAttendance.denominator
				},
				sgpa: p.num(strictColonSeparatedValueWithLabel(semesteri.head[2], "SGPA")),
				earnedCredits: p.num(
					strictColonSeparatedValueWithLabel(semesteri.head[3], "Earned Credit")
				),
				cumulativeCredit: p.num(
					strictColonSeparatedValueWithLabel(semesteri.head[4], "Cumulative Credit")
				),
				cgpa: p.num(strictColonSeparatedValueWithLabel(semesteri.head[5], "CGPA")),
				result: p.str(strictColonSeparatedValueWithLabel(semesteri.head[6], "Result")),
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
				const parsedSubject: Weblab.AcademicAnalysis.SemesterSubject = {
					gpa: p.num(subjectRobj["GPA"]),
					earnedCredits: p.num0(subjectRobj["Earned Credit"]),
					internalMarks: p.num(subjectRobj["Internal Marks"]),
					chances: p.num(subjectRobj["Chance"]),
					attendance: {
						attended: parsedAttendance.numerator,
						classes: parsedAttendance.denominator
					},
					code: p.str(parsedSubjectLine.code),
					name: p.str(parsedSubjectLine.name),
					grade: p.str(subjectRobj["Grade"]),
					result: p.str(subjectRobj["Result"]),
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
					const parsedSeriesExam: Weblab.AcademicAnalysis.SemesterSubjectSeriesExam = {
						slNo: p.num(seriesRobj["Sl.No."]),
						name: p.str(seriesRobj["Exam"]),
						subject: p.str(seriesRobj["Subject"]),
						marks: {
							obtained: parsedMarks.numerator,
							max: parsedMarks.denominator
						},
						classAverage: {
							obtained: parsedClassAvg.numerator,
							max: parsedClassAvg.denominator
						},
						classRank: p.num(seriesRobj["Class Rank"])
					};
					parsedSubject.seriesExams.push(parsedSeriesExam);
				}
			}
		}
		return parsed;
	} catch (err) {
		console.error(err);
		throw new ParseError();
	}
}
