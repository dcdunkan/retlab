import { MiB } from "$lib";
import { ApiEndPoints } from "$lib/generated/api-endpoints";
import { WeblabRoutes } from "$lib/server/constants.js";
import { makeSessionBoundProxy } from "$lib/server/etlab";
import {
	acquireNewWebSession,
	addRequestsMade,
	findActiveWebSession
} from "$lib/server/web-access.js";
import { error, json } from "@sveltejs/kit";
import { waitUntil } from "@vercel/functions";

async function appApiUpload(
	sessionUser: SessionUser,
	assignmentId: string,
	password: string,
	inputFile: File
): Promise<Response> {
	// note: incomplete right now. why?
	// the stupid api returns 500 for late uploads (dk whether for on-time cuz i couldn't test)
	// also for deletes as well. duh. so we do web-access based stuff for now.

	const etproxy = makeSessionBoundProxy(sessionUser);

	const formData = new FormData();
	formData.set("LoginForm[username]", sessionUser.account.username);
	formData.set("LoginForm[password]", password);
	formData.set("assignment_id", assignmentId);
	formData.set("AssignmentData[link]", ""); // note: no need of links as far as i know. raise an issue, if you want to suport it.
	formData.set("AssignmentData[upload_file]", inputFile, inputFile.name);

	// todo: confirm whether the contnet type should be set as "{filext}/*" as per the ProgressBody in retlab-generate
	// const ext = selectedFile.name.split(".").pop() ?? "";
	// const file = new File([selectedFile], selectedFile.name, { type: `${ext}/*` });

	const response = await etproxy({
		endpoint: ApiEndPoints.UPLOAD_ASSIGNMENT_URL,
		method: "POST",
		type: "multipart",
		body: formData
	});

	console.log(response);

	if (response.ok) {
		console.log(response.data);
		return json({ done: 1 });
	} else {
		return error(response.statusCode, response.message ?? "Something went wrong!");
	}
}

async function webAccessUpload(
	user: SessionUser,
	assignmentId: string,
	password: string,
	file: File
): Promise<Response> {
	let webSession = await findActiveWebSession(user);
	if (webSession == null) {
		// silently obtain one
		const attempt = await acquireNewWebSession(user, password);
		if (!attempt.acquired) return error(400, attempt.message);
		webSession = {
			id: attempt.session.id,
			cookieString: attempt.session.cookieString
		};
	}

	const formData = new FormData();
	formData.append("AssignmentData[upload_file]", ""); // thanks a lot for all these, etuwa!
	formData.append("AssignmentData[upload_file]", file, file.name);
	formData.append("yt0", ""); // yes, the submit button, don't touch it, it may break.

	const parsedCollegeBaseUrl = new URL(user.college.baseUrl);
	const uploadAssignmentUrl = new URL(
		WeblabRoutes.SUBMIT_ASSIGNMENT_URL(assignmentId),
		parsedCollegeBaseUrl
	);

	const response = await fetch(uploadAssignmentUrl, {
		method: "POST",
		headers: { Cookie: webSession.cookieString, Referer: uploadAssignmentUrl.href },
		body: formData,
		redirect: "manual"
	});
	waitUntil(addRequestsMade(user, webSession.id, 1));

	if (response.status === 302 && response.headers.has("location")) {
		const location = response.headers.get("location");
		const expectedSuccessRedirectUrl = new URL(
			WeblabRoutes.VIEW_ASSIGNMENT_URL(assignmentId),
			user.college.baseUrl
		);

		if (location != null && location === expectedSuccessRedirectUrl.href) {
			// successful upload! damn! finally!
			return json({ uploaded: true });
		}
	} else if (response.status === 200 && response.headers.get("location") == null) {
		// already uploaded ones!
		// todo: check whether this is also for something else as well.
		return error(400, "Seems like it's already submitted, please verify.");
	} else {
		// lets rule them out as unsuccessful.
	}

	console.log(response.status, response);
	return error(
		400,
		"Could not upload the file (or uploaded, but can't figure out this), please report!"
	);
}

export const POST = async (event) => {
	if (event.locals.sessionUser == null) return error(401, "Unauthorized");

	const input = await event.request.formData();

	const userPassword = input.get("password");
	if (typeof userPassword !== "string" || userPassword.length === 0) {
		return error(400, "Where's the password?");
	}
	const inputFile = input.get("file");
	if (inputFile == null || !(inputFile instanceof File) || inputFile.size === 0) {
		return error(400, "File looks sus...");
	}
	if (inputFile.size > 5 * MiB) {
		return error(400, "Too large to upload through Ret!");
	}
	if (!isSupportedContentType(inputFile.type)) {
		return error(400, "Unsupported file type: " + inputFile.type);
	}

	const assignmentId = input.get("assignment");
	if (typeof assignmentId !== "string" || assignmentId.trim().length === 0) {
		return error(400, "Which assignment?");
	}

	if (__EXPERIMENTAL_WEB_TOGGLES__["upload_assignment_mode"] === "app") {
		return await appApiUpload(event.locals.sessionUser, assignmentId, userPassword, inputFile);
	} else if (__EXPERIMENTAL_WEB_TOGGLES__["upload_assignment_mode"] === "web") {
		return await webAccessUpload(event.locals.sessionUser, assignmentId, userPassword, inputFile);
	} else {
		throw new Error("unknown assignment upload mode defined in build");
	}
};

function isSupportedContentType(type: string): boolean {
	return (
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types
		type.startsWith("image/") ||
		type === "application/pdf" ||
		type.startsWith("text/") ||
		[
			"application/msword", // .doc
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
			"application/vnd.ms-powerpoint", // .ppt
			"application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
			"application/vnd.ms-excel", // .xls
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
		].includes(type)
	);
}
