export const ETLAB_BASE_URL = "https://etlab.in/api/";
export const textEncoder = new TextEncoder();

export const WeblabRoutes = {
	LOGIN_URL: "/user/login",
	LOGOUT_URL: "/user/logout",
	STUDENT_REMARKS_URL: "/student/remarks",
	ACADEMIC_ANALYSIS_URL: "/ktuacademics/student/studentacademicsautonomous",

	VIEW_ASSIGNMENT_URL: (assignmentId: string) => `/student/viewassignment/${assignmentId}`,
	SUBMIT_ASSIGNMENT_URL: (assignmentId: string) => `/student/submitassignment/${assignmentId}`,
	DELETE_SUBMITTED_ASSIGNMENT_URL: (assignmentId: string) =>
		`/student/deletesubmittedassignment/${assignmentId}`
} as const;
