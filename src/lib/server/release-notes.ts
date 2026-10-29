import { imageMeta } from "image-meta";
import type { Parent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { readFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

const IMAGE_URL_PREFIX = "../../static";

async function processNode(root: Parent) {
	for (let i = 0; i < root.children.length; i++) {
		const node = root.children[i];

		if ("children" in node) {
			if (node.children.length === 1 && node.children[0].type === "image") {
				// console.log("unwrapping image");
				root.children[i] = node.children[0];
			}
			await processNode(node);
		}

		if (node.type === "image") {
			if (!node.url.startsWith(IMAGE_URL_PREFIX))
				throw new Error("fatal: not a image under static directory: " + node.url);

			node.url = node.url.slice(IMAGE_URL_PREFIX.length);

			const filepath = "static/" + node.url;
			const meta = imageMeta(await readFile(filepath));
			node.data = { width: meta.width, height: meta.height };

			try {
				const ext = extname(filepath),
					base = basename(filepath, ext);
				const darkfilename = base + "_dark" + ext;
				const darkpath = join(dirname(filepath), darkfilename);
				const darkmeta = imageMeta(await readFile(darkpath)); // check for existence
				node.data.dark = {
					url: node.url.split("/").slice(0, -1).concat(darkfilename).join("/"),
					width: darkmeta.width,
					height: darkmeta.height
				};
			} catch {
				console.warn("warn: no dark mode file found for", filepath);
			}
		}
	}

	return root;
}

export async function getReleaseNotesContent(filepath: string) {
	const content = await readFile(filepath, "utf-8");
	const ast = fromMarkdown(content, "utf-8");
	return await processNode(ast);
}
