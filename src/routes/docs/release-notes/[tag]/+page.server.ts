import { getReleaseNotesContent } from "$lib/server/release-notes";
import { error } from "@sveltejs/kit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { EntryGenerator } from "./$types";
import type { Parent } from "mdast";

const RELEASE_NOTES_DIR = "docs/release-notes";
const metadata = await readFile(join(RELEASE_NOTES_DIR, "generated.json"), "utf-8");
const generatedReleaseNotes: Scripts.ReleaseNoteEntry[] = JSON.parse(metadata);

export const entries: EntryGenerator = async () => {
	return generatedReleaseNotes.map((rn) => ({ tag: rn.tag }));
};

export const load = async (event) => {
	const releaseNote = generatedReleaseNotes.find((rn) => rn.tag === event.params.tag);
	if (releaseNote == null) return error(404, "Tag not found?");

	return {
		details: {
			tag: releaseNote.tag,
			commitSha: releaseNote.commitSha,
			commitShortSha: releaseNote.commitShortSha,
			date: releaseNote.date,
			content: await getReleaseNotesContent(releaseNote.filepath),
			next: releaseNote.next,
			prev: releaseNote.prev
		} satisfies Omit<Scripts.ReleaseNoteEntry, "filepath"> & { content: Parent },
		tags: generatedReleaseNotes.map((rn) => rn.tag)
	};
};

export const prerender = true;
