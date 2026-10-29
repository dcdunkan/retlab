import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { readdir, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { relative } from "node:path/posix";
// import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const gitShortSha = execSync("git rev-parse --short HEAD").toString().trim();
const gitLongSha = execSync("git rev-parse HEAD").toString().trim();

const docsDetails: DocsDetails = {};
for (const direntry of await readdir("src/routes/docs", {
	recursive: true,
	withFileTypes: true
})) {
	if (!direntry.isFile() || direntry.name !== "+page.svelte") continue;
	const stats = await stat(join(direntry.parentPath, direntry.name));
	const route = "/" + relative("src/routes", direntry.parentPath);
	if (route in docsDetails) throw new Error("duplicate docs entry");
	docsDetails[route] = { lastUpdatedAt: stats.mtime };
}
for (const direntry of await readdir("docs/release-notes", {
	withFileTypes: true
})) {
	if (!direntry.isFile() || !direntry.name.endsWith(".md")) continue;
	const stats = await stat(join(direntry.parentPath, direntry.name));
	const route = "/" + direntry.parentPath + "/" + basename(direntry.name, extname(direntry.name));
	if (route in docsDetails) throw new Error("duplicate docs entry");
	docsDetails[route] = { lastUpdatedAt: stats.mtime };
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	worker: {
		format: "es"
	},
	// server: {
	// 	host: "0.0.0.0",
	// 	port: 6173,
	// 	https: {
	// 		cert: readFileSync("./cert/cert.pem"),
	// 		key: readFileSync("./cert/key.pem")
	// 	},
	// 	hmr: {
	// 		host: "debbie.tail8cee02.ts.net",
	// 		protocol: "wss",
	// 		port: 6173
	// 	}
	// },
	define: {
		__GIT_SHORT_SHA__: JSON.stringify(gitShortSha),
		__GIT_SHA__: JSON.stringify(gitLongSha),
		__EXPERIMENTAL_WEB_TOGGLES__: {
			upload_assignment_mode: "web",
			delete_assignment_mode: "web"
		} satisfies ExperimentalWebToggles,
		__DOCS_DETAILS__: docsDetails
	}
});
