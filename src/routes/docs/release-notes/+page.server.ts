import { getReleaseNotesContent } from "$lib/server/release-notes";
import type { Parent } from "mdast";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const RELEASE_NOTES_DIR = "docs/release-notes";

export const load = async () => {
	const metadata = await readFile(join(RELEASE_NOTES_DIR, "generated.json"), "utf-8");
	const generatedReleaseNotes: Scripts.ReleaseNoteEntry[] = JSON.parse(metadata);

	const latest = generatedReleaseNotes[0];

	if (latest == null) {
		return { latest: undefined, tags: [] };
	} else {
		return {
			latest: {
				tag: latest.tag,
				commitSha: latest.commitSha,
				commitShortSha: latest.commitShortSha,
				date: latest.date,
				content: await getReleaseNotesContent(latest.filepath),
				prev: latest.prev,
				next: latest.next
			} satisfies Omit<Scripts.ReleaseNoteEntry, "filepath"> & { content: Parent },
			tags: generatedReleaseNotes.map((rn) => rn.tag)
		};
	}
};

export const prerender = true;
