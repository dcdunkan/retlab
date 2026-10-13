import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const gitShortSha = execSync("git rev-parse --short HEAD").toString().trim();
const gitLongSha = execSync("git rev-parse HEAD").toString().trim();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	worker: {
		format: "es"
	},
	server: {
		host: "0.0.0.0",
		port: 6173,
		https: {
			cert: readFileSync("./cert/cert.pem"),
			key: readFileSync("./cert/key.pem")
		},
		hmr: {
			host: "debbie.tail8cee02.ts.net",
			protocol: "wss",
			port: 6173
		}
	},
	define: {
		__GIT_SHORT_SHA__: JSON.stringify(gitShortSha),
		__GIT_SHA__: JSON.stringify(gitLongSha),
		__EXPERIMENTAL_WEB_TOGGLES__: {
			upload_assignment_mode: "web",
			delete_assignment_mode: "web"
		} satisfies ExperimentalWebToggles
	}
});
