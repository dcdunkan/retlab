<script lang="ts">
	import ArrowsInSimpleIcon from "phosphor-svelte/lib/ArrowsInSimpleIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import ArrowsClockwiseIcon from "phosphor-svelte/lib/ArrowsClockwiseIcon";
	import FilePdfIcon from "phosphor-svelte/lib/FilePdfIcon";
	import EyeIcon from "phosphor-svelte/lib/EyeIcon";

	import Button from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import Select from "$lib/components/select.svelte";
	import type {
		MessageFromCompressionWorker,
		PdfCompressionWorkerMessage
	} from "$lib/workers/pdf-compression.worker";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import prettyBytes from "pretty-bytes";
	import { toast } from "svelte-sonner";
	import { cn } from "$lib/cn-utils";
	import Input from "$lib/components/input.svelte";
	import { cutePercent, safeDivision } from "$lib";
	import box from "$lib/components/box";
	import { onDestroy } from "svelte";

	let {
		open = $bindable(false),
		triggerProps,
		targetFile,
		onSuccess
	}: {
		open?: boolean;
		triggerProps?: DialogPrimitive.TriggerProps;
		targetFile: File;
		onSuccess?: (compressedFile: File) => void;
	} = $props();

	let worker = $state<Worker>();
	let job = $state<
		| { state: "idle" }
		| { state: "started" }
		| { state: "error"; error: unknown }
		| { state: "ongoing"; current: number; total: number }
		| { state: "finished"; compressed: false }
		| { state: "finished"; compressed: true; file: File }
	>({ state: "idle" });

	type CompressionConfiguration = {
		imageDpi: number;
		jpegQuality: number;
	};

	const COMPRESSION_PRESETS = $state({
		slight: {
			label: "Slight",
			config: {
				imageDpi: 300,
				jpegQuality: 0.85
			}
		},
		light: {
			label: "Light",
			config: {
				imageDpi: 200,
				jpegQuality: 0.85
			}
		},
		balanced: {
			label: "Balanced",
			config: {
				imageDpi: 150,
				jpegQuality: 0.75
			}
		},
		maximum: {
			label: "Maximum",
			config: {
				imageDpi: 100,
				jpegQuality: 0.6
			}
		},
		extreme: {
			label: "Extreme",
			config: {
				imageDpi: 72,
				jpegQuality: 0.35
			}
		},
		custom: {
			label: "Custom",
			config: {
				imageDpi: 150,
				jpegQuality: 0.75
			}
		}
	} as const);

	let selectedPreset = $state<keyof typeof COMPRESSION_PRESETS>("balanced");

	let currentConfiguration = $derived<CompressionConfiguration>(
		COMPRESSION_PRESETS[selectedPreset].config
	);

	function compressedFileName(filename: string) {
		const doti = filename.lastIndexOf(".");
		if (doti === -1) return filename + "_rc";
		const name = filename.slice(0, doti),
			ext = filename.slice(doti);
		return name + "_rc" + ext;
	}

	let previewObjectUrl = $state<string>();

	onDestroy(() => {
		if (previewObjectUrl != null) {
			URL.revokeObjectURL(previewObjectUrl);
			previewObjectUrl = undefined;
		}
		if (worker != null) worker.terminate();
	});
</script>

{#if targetFile instanceof File}
	<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
		{#snippet trigger()}
			<DialogPrimitive.Trigger {...triggerProps}>
				<ArrowsInSimpleIcon weight="bold" />
				Compress
			</DialogPrimitive.Trigger>
		{/snippet}

		{#snippet title()}
			Compress!
		{/snippet}

		{#snippet description()}
			I shrink PDF files. Currently only
			<a
				class="font-medium underline decoration-ret-accent decoration-wavy underline-offset-2 hover:text-ret-accent"
				href="https://en.wikipedia.org/wiki/Lossy_compression"
			>
				Lossy compression
			</a>.
		{/snippet}

		<div class="space-y-4 p-1">
			<div class="flex place-items-center gap-2 border-2 border-border px-3 py-2">
				<FilePdfIcon class="size-6 shrink-0" />
				<div>
					<div class="line-clamp-1 text-sm font-semibold">{targetFile.name}</div>
					<div class="text-sm text-muted-foreground">{prettyBytes(targetFile.size)}</div>
				</div>
			</div>

			<div>
				<div class="space-y-2">
					<div class="flex place-items-center justify-between gap-2">
						<div>
							<div class="font-medium">Compression Preset</div>
							<div class="text-sm text-muted-foreground">Choose or set below.</div>
						</div>
						<Select
							type="single"
							items={Object.entries(COMPRESSION_PRESETS).map(([value, { label }]) => ({
								value,
								label
							}))}
							allowDeselect={false}
							bind:value={selectedPreset}
						/>
					</div>

					<div class="flex place-items-center justify-between gap-2">
						<div>
							<div class="font-medium">Image DPI (50&ndash;300)</div>
							<div class="text-sm text-muted-foreground">Low = low quality</div>
						</div>
						<Input
							type="number"
							inputmode="numeric"
							placeholder="150"
							min={50}
							max={300}
							value={currentConfiguration.imageDpi}
							oninput={(e) => {
								selectedPreset = "custom";
								currentConfiguration.imageDpi = e.currentTarget.valueAsNumber;
							}}
						/>
					</div>

					<div class="flex place-items-center justify-between gap-2">
						<div>
							<div class="font-medium">JPEG quality (in &percnt;)</div>
							<div class="text-sm text-muted-foreground">Really affects the output size.</div>
						</div>
						<Input
							type="number"
							inputmode="numeric"
							placeholder="85"
							min={10}
							max={100}
							value={currentConfiguration.jpegQuality * 100}
							oninput={(event) => {
								selectedPreset = "custom";
								currentConfiguration.jpegQuality = event.currentTarget.valueAsNumber / 100;
							}}
						/>
					</div>
				</div>
			</div>

			<div
				class={cn(
					"flex place-items-center gap-2 border-2 px-3 py-2 text-sm",
					job.state === "idle"
						? "border-border bg-muted text-muted-foreground"
						: job.state === "error"
							? "border-error-border bg-error text-error-foreground"
							: job.state === "ongoing" || job.state === "started"
								? "border-info-border bg-info text-info-foreground"
								: job.state === "finished"
									? "border-border"
									: ""
				)}
			>
				{#if job.state === "idle"}
					<div>Click compress to start!</div>
				{:else if job.state === "error"}
					<div>Something went wrong, try again?</div>
				{:else}
					<FilePdfIcon class="size-6 shrink-0" />
					<div class="grow">
						<div class="line-clamp-1 font-semibold">{compressedFileName(targetFile.name)}</div>
						<div>
							{#if job.state === "started"}
								Starting...
							{:else if job.state === "ongoing"}
								{job.current} / {job.total} pages done &lpar;{cutePercent(
									safeDivision(job.current, job.total) * 100
								)} &percnt;&rpar;
							{:else if job.state === "finished"}
								{#if job.compressed}
									<span class="text-ret-accent">
										{prettyBytes(job.file.size)}

										({cutePercent(((targetFile.size - job.file.size) * 100) / targetFile.size)} % saved)
									</span>
								{:else}
									Hmm...
								{/if}
							{/if}
						</div>
					</div>

					{#if job.state === "finished" && job.compressed}
						<Button
							size="icon-sm"
							variant="outline"
							onclick={() => {
								if (job.state !== "finished" || !job.compressed || !(job.file instanceof File))
									return;
								if (previewObjectUrl != null) {
									URL.revokeObjectURL(previewObjectUrl);
								}
								previewObjectUrl = URL.createObjectURL(job.file);
								window.open(previewObjectUrl, "_blank");
							}}
						>
							<EyeIcon weight="bold" />
						</Button>
						<Button
							size="sm"
							onclick={() => {
								if (job.state !== "finished" || !job.compressed || !(job.file instanceof File))
									return;

								onSuccess?.(job.file);

								open = false;
								job = { state: "idle" };

								if (previewObjectUrl != null) {
									URL.revokeObjectURL(previewObjectUrl);
									previewObjectUrl = undefined;
								}
							}}
						>
							Use
						</Button>
					{/if}
				{/if}
			</div>

			{#if job.state === "finished" && !job.compressed}
				<box.Error>
					BUT... could not get the file size further down than that ({prettyBytes(
						targetFile.size
					)})! Please try some other websites or may be re-check your file?
				</box.Error>
			{/if}
		</div>

		{#snippet footer()}
			<Button
				variant="destructive"
				onclick={() => {
					open = false;
					job = { state: "idle" };
					if (previewObjectUrl != null) {
						URL.revokeObjectURL(previewObjectUrl);
						previewObjectUrl = undefined;
					}
					if (worker != null) {
						worker.terminate();
						console.log("Terminated pdf compression worker");
						worker = undefined;
					}
				}}
			>
				{#if job.state === "finished" && job.compressed}
					Discard & Close
				{:else}
					Cancel & Close
				{/if}
			</Button>
			<Button
				disabled={job.state !== "error" && job.state !== "idle" && job.state !== "finished"}
				onclick={async () => {
					if (job.state !== "idle" && job.state !== "error" && job.state !== "finished") return;

					job = { state: "started" };
					if (previewObjectUrl != null) {
						URL.revokeObjectURL(previewObjectUrl);
						previewObjectUrl = undefined;
					}

					const PdfCompressionWorker = await import("$lib/workers/pdf-compression.worker?worker");
					worker = new PdfCompressionWorker.default();
					const buffer = await targetFile.arrayBuffer();

					worker.onmessage = (event: MessageEvent<MessageFromCompressionWorker>) => {
						if (event.data == null || typeof event.data !== "object") {
							console.error(event, event.data);
							toast.error("Invalid data recieved from web worker!");
							return;
						}

						if (event.data.type === "error") {
							console.error(event.data.error);
							toast.error("Failed to compress!");
							job = {
								state: "error",
								error: event.data.error
							};
							worker = undefined;
						} else if (event.data.type === "progress") {
							job = {
								state: "ongoing",
								current: event.data.current,
								total: event.data.total
							};
						} else if (event.data.type === "done") {
							if (event.data.compressed) {
								if (!(event.data.buffer instanceof ArrayBuffer)) {
									toast.error("Mistake?");
								} else {
									const file = new File([event.data.buffer], compressedFileName(targetFile.name), {
										type: "application/pdf"
									});

									job = {
										state: "finished",
										compressed: true,
										file: file
									};
								}
							} else {
								job = {
									state: "finished",
									compressed: false
								};
							}
							worker = undefined;
						} else {
							// note: not an error?
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							const what = event.data as any;
							if (
								typeof what === "object" &&
								what.data == null &&
								what.sourceName === "worker" &&
								what.targetName === "main" &&
								what.action === "ready"
							) {
								console.info("got message from pdf.js worker thingy");
								return;
							}
							console.warn(event, event.data);
							toast.error("Invalid data recieved from web worker!");
						}
					};

					worker.postMessage({
						type: "compress",
						buffer: new Uint8Array(buffer),
						configuration: {
							dpi: currentConfiguration.imageDpi,
							jpegQuality: currentConfiguration.jpegQuality
						}
					} satisfies PdfCompressionWorkerMessage);
				}}
			>
				{#if job.state === "idle"}
					<ArrowsInSimpleIcon weight="bold" /> Compress
				{:else if job.state === "error"}
					<ArrowsClockwiseIcon weight="bold" /> Try again
				{:else if job.state === "ongoing"}
					<SpinnerIcon class="animate-spin" weight="bold" /> {job.current} / {job.total} pages
				{:else if job.state === "started"}
					<SpinnerIcon class="animate-spin" weight="bold" /> Compressing...
				{:else if job.state === "finished"}
					<ArrowsInSimpleIcon weight="bold" /> Compress again!
				{:else}
					??
				{/if}
			</Button>
		{/snippet}
	</Dialog>
{/if}
