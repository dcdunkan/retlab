export const ETLAB_BASE_URL = "https://etlab.in/api/";
export const textEncoder = new TextEncoder();

export const WeblabRoutes = {
	LOGIN_URL: "/user/login",
	LOGOUT_URL: "/user/logout",
	STUDENT_REMARKS_URL: "/student/remarks",
	ACADEMIC_ANALYSIS_URL: "/ktuacademics/student/studentacademicsautonomous"
} as const;
