import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const gitShortSha = execSync("git rev-parse --short HEAD").toString().trim();
const gitLongSha = execSync("git rev-parse HEAD").toString().trim();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// server: {
	// 	https: {
	// 		cert: readFileSync("./cert/cert.pem"),
	// 		key: readFileSync("./cert/key.pem")
	// 	},
	// 	hmr: {
	// 		host: "debbie.tail8cee02.ts.net",
	// 		protocol: "wss",
	// 		port: 5173
	// 	}
	// },
	define: {
		__GIT_SHORT_SHA__: JSON.stringify(gitShortSha),
		__GIT_SHA__: JSON.stringify(gitLongSha)
	}
});
