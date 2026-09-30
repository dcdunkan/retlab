export namespace Weblab {
	export namespace AcademicAnalysis {
		export type Semester = {
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

		export type SemesterSubject = {
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

		export type SemesterSubjectSeriesExam = {
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
	}
}
