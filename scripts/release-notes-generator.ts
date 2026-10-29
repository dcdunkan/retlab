import { execSync } from "node:child_process";
import { lstatSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RELEASE_NOTES_DIR = "./docs/release-notes";

const tags = execSync("git tag --list --sort=creatordate")
	.toString()
	.trim()
	.split("\n")
	.map((tag) => tag.trim());

console.log(`found ${tags.length} tags`);

const notes: {
	tag: string;
	commitSha: string;
	commitShortSha: string;
	date: Date;
	filepath: string;
	next?: string;
	prev?: string;
	// todo: collect new contributors list
}[] = [
	{
		tag: "unreleased",
		commitSha: "",
		commitShortSha: "",
		date: new Date(),
		filepath: join(RELEASE_NOTES_DIR, "unreleased.md")
	}
];

for (const tag of tags) {
	const commitSha = execSync(`git rev-parse ${tag}`).toString().trim();
	const commitShortSha = execSync(`git rev-parse --short ${tag}`).toString().trim();
	const time = execSync(`git show --no-patch --format=%ci ${commitSha}`).toString().trim();
	try {
		const path = join(RELEASE_NOTES_DIR, `${tag}.md`);
		lstatSync(path);
		notes.push({ tag, commitSha, commitShortSha, date: new Date(time), filepath: path });
	} catch {
		console.error("fatal: could not find release notes for", tag);
		process.exit(1);
	}
}

for (let i = 1; i < notes.length; i++) {
	if (i > 1) {
		notes[i].prev = notes[i - 1].tag;
	}
	if (i < notes.length - 1) {
		notes[i].next = notes[i + 1].tag;
	}
}

writeFileSync(
	join(RELEASE_NOTES_DIR, "generated.json"),
	JSON.stringify(notes.toReversed()),
	"utf-8"
);
