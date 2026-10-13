import { getDocumentProxy } from "unpdf";
import { PDFDocument } from "pdf-lib";

export type PDFDocumentProxy = Awaited<ReturnType<typeof getDocumentProxy>>;

export type PdfCompressionConfiguration = {
	dpi: number;
	jpegQuality: number;
};

// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/canvas#maximum_canvas_size
// https://jhildenbiddle.github.io/canvas-size/#/?id=test-results
const MAX_PIXELS = 16_000_000; // iOS Safari canvas ceiling

async function renderPage(
	pdf: PDFDocumentProxy,
	pageNum: number,
	dpi: number
): Promise<{ canvas: OffscreenCanvas; width: number; height: number }> {
	const page = await pdf.getPage(pageNum);
	const base = page.getViewport({ scale: 1 });
	let scale = dpi / 72; // damn PDFs are interesting, "PDF Unit" = 1 inch = 72 points
	if (base.width * base.height * scale * scale > MAX_PIXELS) {
		scale = Math.sqrt(MAX_PIXELS / (base.width * base.height));
	}
	const viewport = page.getViewport({ scale: scale });
	const canvas = new OffscreenCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
	const ctx = canvas.getContext("2d", { alpha: false });
	if (ctx == null) throw new Error("Failed to get canvas context");
	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	await page.render({
		// @ts-expect-error because of offscreencanvas i understand
		canvasContext: ctx,
		viewport: viewport
	}).promise;
	page.cleanup();
	return { canvas, width: base.width, height: base.height };
}

async function canvasToJpeg(canvas: OffscreenCanvas, jpegQuality: number): Promise<ArrayBuffer> {
	const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: jpegQuality });
	return await blob.arrayBuffer();
}

class OffscreenCanvasFactory {
	create(w: number, h: number) {
		const canvas = new OffscreenCanvas(w, h);
		return { canvas, context: canvas.getContext("2d") };
	}
	reset<CC extends { canvas: OffscreenCanvas }>(cc: CC, w: number, h: number) {
		cc.canvas.width = w;
		cc.canvas.height = h;
	}
	destroy<C extends { canvas: OffscreenCanvas }>(cc: C) {
		cc.canvas.width = cc.canvas.height = 0;
	}
}

export async function flattenPdf(
	inputPdf: Uint8Array,
	config: PdfCompressionConfiguration,
	onPageProgress?: (current: number, total: number) => void
): Promise<Uint8Array<ArrayBufferLike>> {
	const pdf = await getDocumentProxy(inputPdf, {
		disableFontFace: true, // otherwise, fonts are not known maybe, so it will try to link and all goes to shit and it starts drawing boxes
		CanvasFactory: OffscreenCanvasFactory
	});
	const output = await PDFDocument.create();

	for (let i = 1; i <= pdf.numPages; i++) {
		const page = await renderPage(pdf, i, config.dpi);
		const jpeg = await output.embedJpg(await canvasToJpeg(page.canvas, config.jpegQuality));
		output
			.addPage([page.width, page.height])
			.drawImage(jpeg, { x: 0, y: 0, width: page.width, height: page.height });
		page.canvas.width = page.canvas.height = 0;
		onPageProgress?.(i, pdf.numPages);
		// await new Promise((r) => setTimeout(r, 50));
	}

	return await output.save();
}
