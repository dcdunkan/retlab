import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { execSync } from "node:child_process";
import { defineConfig } from "vite";

const gitShortSha = execSync("git rev-parse --short HEAD").toString().trim();
const gitLongSha = execSync("git rev-parse HEAD").toString().trim();

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__GIT_SHORT_SHA__: JSON.stringify(gitShortSha),
		__GIT_SHA__: JSON.stringify(gitLongSha)
	}
});
