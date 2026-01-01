import { parseServerDateString } from "$lib";
import type { assignment } from "$lib/generated/models";

export function parseAssignmentsResponse(
	response: assignment.AssignmentResponse,
	collegeBaseUrlOrigin: string
) {
	return response.assignments.map((assignment) => {
		const hasUploaded =
			assignment.uploaded_file !== "" && assignment.uploaded_file !== collegeBaseUrlOrigin;
		const isDue = assignment.can_submit && (!assignment.upload || !hasUploaded);

		// const issueDate = parseServerDateString(assignment.issue_date);
		// const lastDate = parseServerDateString(assignment.last_date);

		return {
			...assignment,
			// todo: parse subject to code & name
			_parsed: {
				issue_date: parseServerDateString(assignment.issue_date),
				last_date: parseServerDateString(assignment.last_date),
				has_uploaded: hasUploaded,
				is_due: !!isDue
			}
		};
	});
}
