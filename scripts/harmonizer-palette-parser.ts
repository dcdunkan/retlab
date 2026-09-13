// https://harmonizer.evilmartians.com thing

import * as fs from "node:fs/promises";
import { resolve } from "node:path";
import z from "zod";

if (process.argv.length !== 6)
	throw new Error(
		"error: run like 'node script.ts input-palette.json output-set.json output-docs.typ output-helper.html'"
	);

const INPUT_PALETTE_PATH = process.argv[2];
const OUTPUT_TOKEN_SET_PATH = process.argv[3];
const OUTPUT_TYPST_PATH = process.argv[4];
const OUTPUT_HELPER_HTML_PATH = process.argv[5];

const HARMONIZED_PALETTE_SCHEMA = z.array(
	z.object({
		level: z.coerce.number().int(),
		hue: z.string(),
		oklch: z.string().startsWith("oklch"),
		hex: z.string().regex(/^#[0-9a-f]{6}$/i)
	})
);

const palette = HARMONIZED_PALETTE_SCHEMA.parse(
	JSON.parse(await fs.readFile(INPUT_PALETTE_PATH, "utf-8"))
);

// https://design.penpot.app design tokens set.

const groupedTokens: Record<string, Record<number, { hex: string; oklch: string }>> = {
	// harmonizer can't handle neutral
	neutral: {
		200: { hex: "#eeeeee", oklch: "oklch(0.950 0 0)" },
		300: { hex: "#c5c5c5", oklch: "oklch(0.822 0 0)" },
		400: { hex: "#9d9d9d", oklch: "oklch(0.695 0 0)" },
		500: { hex: "#777777", oklch: "oklch(0.568 0 0)" },
		600: { hex: "#535353", oklch: "oklch(0.441 0 0)" },
		700: { hex: "#313131", oklch: "oklch(0.314 0 0)" },
		800: { hex: "#131313", oklch: "oklch(0.187 0 0)" }
	}
};

for (const color of palette) {
	const hue = color.hue.toLowerCase();
	groupedTokens[hue] ??= {};

	if (color.level in groupedTokens[hue])
		throw new Error(`Color level ${color.level} in ${hue} already existed`);

	groupedTokens[hue][color.level] = {
		hex: color.hex,
		oklch: color.oklch
	};
}

const generatedTokenSet: Record<
	string,
	Record<number, { $value: string; $type: "color"; $description: string }>
> = {};

for (const hue in groupedTokens) {
	generatedTokenSet[hue] ??= {};

	for (const level in groupedTokens[hue]) {
		const token = groupedTokens[hue][level];
		generatedTokenSet[hue][level] = {
			$type: "color",
			$value: token.hex,
			$description: token.oklch
		};
	}
}

await fs.writeFile(OUTPUT_TOKEN_SET_PATH, JSON.stringify(generatedTokenSet), "utf-8");
console.log("written tokens set to", resolve(OUTPUT_TOKEN_SET_PATH));

// Generate typst file: colors.typ

const colors: Record<string, string> = {};
const tableCells: string[] = [
	"table.header()" + ["Group", 200, 300, 400, 500, 600, 700, 800].map((x) => `[${x}]`).join("")
];

for (const hue in groupedTokens) {
	const rowCells = [`[${hue}]`];

	for (const level in groupedTokens[hue]) {
		const levelNo = Number(level);
		const token = groupedTokens[hue][level];

		const [l, c, h, a = "100%"] = token.oklch.slice("oklch(".length, -1).split(" ");
		if (rowCells.length === 1) rowCells[0] = `[${hue}\\ *${h}*]`;
		const colorTokenVariableName = `${hue}-${level}`;
		colors[colorTokenVariableName] = `color.oklch(${Number(l) * 100}%, ${c}, ${h}deg, ${a})`;

		let textColor = `${hue}-${200}`;
		if (levelNo <= 500) {
			textColor = `${hue}-${800}`;
		}

		rowCells.push(
			`color-square(colors.${colorTokenVariableName}, colors.${textColor}, "${token.hex}")`
		);
	}

	tableCells.push(...rowCells);
}

const generatedColorFile = `#let colors = (
${Object.entries(colors)
	.map(([name, value]) => `${name}: ${value}`)
	.join(",")}
)

#let color-square(bg-color, text-color, hex) = {
  square(fill: bg-color)[#text(font: "mononoki", size: 10pt, weight: "bold", fill: text-color)[#hex]]
}

#let colors-table = table(
  columns: 8,
  ${tableCells.join(",")},
)`;

await fs.writeFile(OUTPUT_TYPST_PATH, generatedColorFile, "utf-8");
console.log("written typst file to", resolve(OUTPUT_TYPST_PATH));

// Helper html file

const rows = Object.keys(groupedTokens);
const cols = Object.keys(groupedTokens[rows[0]])
	.map(Number)
	.sort((a, b) => a - b);

const cells = rows.flatMap((row) =>
	cols.map((col) => {
		const { hex, oklch } = groupedTokens[row][col];
		return `<div class="cell" style="background:${hex}" data-hex="${hex}" data-oklch="${oklch}"
      onclick="pick(this)" title="${row}-${col}"></div>`;
	})
);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Color Tokens</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font:13px/1.5 monospace;padding:20px;background:#111;color:#eee}
  #top{display:flex;align-items:center;gap:16px;margin-bottom:14px}
  label{display:flex;align-items:center;gap:6px;cursor:pointer}
  #info{font-size:12px;opacity:.7;min-height:1.5em}
  #grid{display:grid;grid-template-columns:repeat(${cols.length},48px);gap:4px}
  .cell{width:48px;height:48px;border-radius:6px;cursor:pointer;transition:transform .1s}
  .cell:hover{transform:scale(1.12);z-index:1;position:relative}
  .cell.active{outline:2px solid #fff;outline-offset:2px}
  #toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:#333;color:#fff;padding:6px 14px;border-radius:20px;
    font-size:12px;opacity:0;pointer-events:none;transition:opacity .2s}
  #toast.show{opacity:1}
</style>
</head>
<body>
<div id="top">
  <label><input type="checkbox" id="mode" onchange="toggleMode()"> oklch</label>
  <div id="info">click color to copy</div>
</div>
<div id="grid">${cells.join("\n")}</div>
<div id="toast"></div>
<script>
  let useOklch = false;
  let active = null;
  function toggleMode() {
    useOklch = document.getElementById('mode').checked;
    if (active) updateInfo(active);
  }
  function pick(el) {
    if (active) active.classList.remove('active');
    active = el;
    el.classList.add('active');
    const val = useOklch ? el.dataset.oklch : el.dataset.hex;
    navigator.clipboard.writeText(val).catch(()=>{});
    updateInfo(el);
    toast('Copied: ' + val);
  }
  function updateInfo(el) {
    document.getElementById('info').textContent =
      el.dataset.hex + '  ·  ' + el.dataset.oklch;
  }
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove('show'), 1800);
  }
</script>
</body>
</html>`;

await fs.writeFile(OUTPUT_HELPER_HTML_PATH, html, "utf-8");
console.log("output written to", resolve(OUTPUT_HELPER_HTML_PATH));
