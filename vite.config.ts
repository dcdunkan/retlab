import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
// import { readFileSync } from "node:fs";

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()]
	// server: {
	// 	https: {
	// 		cert: readFileSync("./cert/cert.pem"),
	// 		key: readFileSync("./cert/key.pem")
	// 	}
	// }
});
