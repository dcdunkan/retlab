/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { flattenPdf, type PdfCompressionConfiguration } from "$lib/pdf-compression";

export type PdfCompressionWorkerMessage = {
	type: "compress";
	buffer: Uint8Array;
	configuration: PdfCompressionConfiguration;
};

export type MessageFromCompressionWorker =
	| { type: "done"; compressed: false }
	| { type: "done"; compressed: true; buffer: ArrayBufferLike }
	| { type: "progress"; current: number; total: number }
	| { type: "error"; error: unknown };

function post(message: MessageFromCompressionWorker, transferable?: Transferable[]) {
	return transferable == null ? postMessage(message) : postMessage(message, transferable);
}

self.onmessage = async (event: MessageEvent<PdfCompressionWorkerMessage>) => {
	if (
		event == null ||
		event.data == null ||
		typeof event.data !== "object" ||
		typeof event.data.type !== "string"
	) {
		console.error("Invalid event data recieved");
		return;
	}

	if (event.data.type === "compress") {
		try {
			const originalSize = event.data.buffer.byteLength;
			const flattened = await flattenPdf(
				event.data.buffer,
				event.data.configuration,
				(current, total) => {
					post({ type: "progress", current: current, total: total });
				}
			);
			if (flattened.byteLength >= originalSize) {
				post({ type: "done", compressed: false });
			} else {
				post({ type: "done", compressed: true, buffer: flattened.buffer }, [flattened.buffer]);
			}
		} catch (error) {
			console.error(error);
			post({ type: "error", error: error });
		}
	} else {
		console.error("Unsupported event type: " + event.data.type);
	}
};

self.onerror = (e) => {
	console.error("Error occurred in compression worker:");
	console.error(e);
};
