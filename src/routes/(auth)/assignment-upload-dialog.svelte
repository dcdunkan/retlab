<script lang="ts">
	import FilePdfIcon from "phosphor-svelte/lib/FilePdfIcon";
	import FileDocIcon from "phosphor-svelte/lib/FileDocIcon";
	import FileImageIcon from "phosphor-svelte/lib/FileImageIcon";
	import FilePptIcon from "phosphor-svelte/lib/FilePptIcon";
	import FileXlsIcon from "phosphor-svelte/lib/FileXlsIcon";
	import FileTextIcon from "phosphor-svelte/lib/FileTextIcon";
	import FileIcon from "phosphor-svelte/lib/FileIcon";
	import UploadSimpleIcon from "phosphor-svelte/lib/UploadSimpleIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import EyeIcon from "phosphor-svelte/lib/EyeIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";
	import ArrowsCounterClockwiseIcon from "phosphor-svelte/lib/ArrowsCounterClockwiseIcon";
	import WarningIcon from "phosphor-svelte/lib/WarningIcon";

	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import { onDestroy, onMount } from "svelte";
	import type { ParsedAssignmentWithResults } from "./assignments/+page.svelte";
	import { toast } from "svelte-sonner";
	import { cn } from "$lib/cn-utils";
	import Input from "$lib/components/input.svelte";
	import prettyBytes from "pretty-bytes";
	import { cutePercent, MiB, safeDivision, SECOND } from "$lib";
	import PdfCompressionDialog from "./pdf-compression-dialog.svelte";
	import { isHttpError } from "@sveltejs/kit";

	let {
		open = $bindable(false),
		assignment,
		onUploadComplete
	}: {
		open?: boolean;
		assignment: ParsedAssignmentWithResults;
		onUploadComplete: () => Promise<void>;
	} = $props();

	let dropAreaRef = $state<HTMLLabelElement>();
	let fileInputRef = $state<HTMLInputElement>();
	let overDropZoneStatus = $state<"supported" | "unsupported" | "not-over">("not-over");

	let selectedFile = $state<File>();
	let selectedFileObjectURL = $state<string>();
	let isUploading = $state(false);
	let userPassword = $state("");

	function isSupportedFile(item: DataTransferItem) {
		if (item.kind !== "file") return false;
		return (
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types/Common_types
			item.type.startsWith("image/") ||
			item.type === "application/pdf" ||
			item.type.startsWith("text/") ||
			[
				"application/msword", // .doc
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
				"application/vnd.ms-powerpoint", // .ppt
				"application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
				"application/vnd.ms-excel", // .xls
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
			].includes(item.type)
		);
	}

	const MIN_FILE_SIZE_LIMIT = 1 * MiB;
	const MAX_FILE_SIZE_LIMIT = 5 * MiB;

	function isImageFile(file: File) {
		return file.type.startsWith("image/");
	}
	function isPdfFile(file: File) {
		return file.type === "application/pdf";
	}
	function isTextFile(file: File) {
		return file.type.startsWith("text/");
	}
	// function isDocSuiteFile(file: File) {
	// 	return [
	// 		"application/msword", // .doc
	// 		"application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
	// 		"application/vnd.ms-powerpoint", // .ppt
	// 		"application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
	// 		"application/vnd.ms-excel", // .xls
	// 		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" // .xlsx
	// 	].includes(file.type);
	// }

	onMount(() => {
		function globalDropHandler(e: DragEvent) {
			e.preventDefault();
			if (e.dataTransfer == null) return;
			if (Array.from(e.dataTransfer.items).some(isSupportedFile)) {
				e.preventDefault(); // note: prevent default allows it to be dropped
			}
		}
		function globalDragoverHandler(e: DragEvent) {
			if (
				e.dataTransfer == null ||
				dropAreaRef == null ||
				e.target == null ||
				!(e.target instanceof HTMLElement)
			)
				return;

			if (Array.from(e.dataTransfer.items).some(isSupportedFile)) {
				e.preventDefault();
				if (!dropAreaRef.contains(e.target)) {
					e.dataTransfer.dropEffect = "none";
				}
			}
		}

		window.addEventListener("drop", globalDropHandler);
		window.addEventListener("dragover", globalDragoverHandler);

		return () => {
			window.removeEventListener("drop", globalDropHandler);
			window.removeEventListener("dragover", globalDragoverHandler);
		};
	});
	onDestroy(() => {
		if (selectedFileObjectURL != null) {
			URL.revokeObjectURL(selectedFileObjectURL);
			selectedFileObjectURL = undefined;
		}
	});

	let uploadState = $state<{ state: "idle" } | { state: "ongoing"; done: number; total: number }>({
		state: "idle"
	});
</script>

<Dialog
	bind:open
	interactOutsideBehavior="ignore"
	showCloseIcon={false}
	onOpenChange={(open) => {
		if (!open) {
			selectedFile = undefined;
			if (selectedFileObjectURL != null) {
				URL.revokeObjectURL(selectedFileObjectURL);
				selectedFileObjectURL = undefined;
			}
		}
	}}
>
	{#snippet title()}
		Upload {assignment.title}
	{/snippet}

	{#snippet description()}
		{assignment.subject}
	{/snippet}

	<div class="space-y-4 p-2">
		<div class="space-y-2">
			<div class="font-semibold">Select your assignment file</div>
			<label
				for="assignment-file-input"
				bind:this={dropAreaRef}
				ondrop={(e) => {
					if (selectedFileObjectURL != null) {
						URL.revokeObjectURL(selectedFileObjectURL);
						selectedFileObjectURL = undefined;
					}
					overDropZoneStatus = "not-over";
					e.preventDefault();
					if (e.dataTransfer == null) return;
					const fileItems = Array.from(e.dataTransfer.items).filter(isSupportedFile);

					if (fileItems.length === 0) {
						return toast.error("No supported files in that drop!");
					}
					const firstFile = fileItems[0]?.getAsFile();
					if (firstFile == null) {
						return toast.error("WEIRD! Could not grab a file!");
					}
					selectedFile = firstFile;
				}}
				ondragenter={(e) => {
					if (e.dataTransfer == null) return;
					e.preventDefault();
					if (Array.from(e.dataTransfer.items).some(isSupportedFile)) {
						overDropZoneStatus = "supported";
						e.preventDefault();
						e.dataTransfer.dropEffect = "copy";
					} else {
						overDropZoneStatus = "unsupported";
						e.dataTransfer.dropEffect = "none";
					}
				}}
				ondragleave={(e) => {
					e.preventDefault();
					overDropZoneStatus = "not-over";
				}}
				ondragover={(e) => {
					if (e.dataTransfer == null) return;
					if (Array.from(e.dataTransfer.items).some(isSupportedFile)) {
						overDropZoneStatus = "supported";
						e.preventDefault();
						e.dataTransfer.dropEffect = "copy";
					} else {
						overDropZoneStatus = "unsupported";
						e.dataTransfer.dropEffect = "none";
					}
				}}
				id="drop-zone"
				class={cn(
					"flex min-h-48 w-full flex-col items-center justify-center border-2 p-4 transition-all duration-150",
					overDropZoneStatus === "supported"
						? "border-success-border bg-success text-success-foreground"
						: overDropZoneStatus === "unsupported"
							? "border-error-border bg-error text-error-foreground"
							: selectedFile != null
								? "border-border bg-background text-foreground"
								: "border-border bg-muted text-muted-foreground"
				)}
			>
				<input
					id="assignment-file-input"
					bind:this={fileInputRef}
					type="file"
					disabled={isUploading}
					accept="image/*,.pdf,text/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
					multiple={false}
					class="hidden"
					onchange={(e) => {
						if (e.currentTarget.files == null || e.currentTarget.files.length === 0) return;
						if (selectedFileObjectURL != null) {
							URL.revokeObjectURL(selectedFileObjectURL);
							selectedFileObjectURL = undefined;
						}
						selectedFile = e.currentTarget.files[0];
					}}
				/>
				{#if selectedFile == null}
					<div class="flex flex-col items-center justify-center gap-2 text-sm">
						<div class="flex">
							<FilePdfIcon class="size-8" />
							<FileImageIcon class="size-8" />
							<FileTextIcon class="size-8" />
							<FileDocIcon class="size-8" />
							<FilePptIcon class="size-8" />
							<FileXlsIcon class="size-8" />
						</div>
						{#if overDropZoneStatus === "supported"}
							<div>Drop here!</div>
						{:else if overDropZoneStatus === "unsupported"}
							<div>You can't drop that here!</div>
						{:else}
							<div>Drag a file here, or click to pick one.</div>
						{/if}
					</div>
				{:else}
					{@const file = selectedFile}
					<div class="flex flex-col items-center justify-center gap-2 text-foreground">
						<div>
							{#if isPdfFile(file)}
								<FilePdfIcon class="size-8" />
							{:else if isImageFile(file)}
								<FileImageIcon class="size-8" />
							{:else if isTextFile(file)}
								<FileTextIcon class="size-8" />
							{:else if file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
								<FileDocIcon class="size-8" />
							{:else if file.type === "application/vnd.ms-powerpoint" || file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation"}
								<FilePptIcon class="size-8" />
							{:else if file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
								<FileXlsIcon class="size-8" />
							{:else}
								<FileIcon class="size-8" />
							{/if}
						</div>
						<div class="text-center">
							<div class="font-medium wrap-anywhere whitespace-normal">{file.name}</div>
							<div class="text-sm">{prettyBytes(file.size)}</div>
						</div>
						<div class="mt-2 flex flex-wrap items-center justify-center gap-2">
							<Button
								variant="outline"
								size="icon-sm"
								disabled={isUploading}
								onclick={() => {
									if (isUploading) return;
									if (selectedFileObjectURL == null) {
										selectedFileObjectURL = URL.createObjectURL(file);
									}
									window.open(selectedFileObjectURL, "_blank");
								}}
							>
								<EyeIcon weight="bold" />
							</Button>

							<Button
								variant="outline"
								size="icon-sm"
								disabled={isUploading}
								onclick={() => {
									if (isUploading) return;
									selectedFile = undefined;
									if (selectedFileObjectURL != null) {
										URL.revokeObjectURL(selectedFileObjectURL);
										selectedFileObjectURL = undefined;
									}
								}}
							>
								<XIcon weight="bold" />
							</Button>
							<Button
								variant="outline"
								size="icon-sm"
								disabled={isUploading}
								onclick={() => {
									if (isUploading) return;
									fileInputRef?.click();
								}}
							>
								<ArrowsCounterClockwiseIcon weight="bold" />
							</Button>

							{#if isPdfFile(file)}
								<PdfCompressionDialog
									targetFile={file}
									triggerProps={{
										class: buttonVariants({
											variant: "outline",
											size: "sm"
										}),
										disabled: isUploading || file.size < MIN_FILE_SIZE_LIMIT
									}}
									onSuccess={(compressedFile) => {
										if (selectedFileObjectURL != null) {
											URL.revokeObjectURL(selectedFileObjectURL);
											selectedFileObjectURL = undefined;
										}
										selectedFile = compressedFile;
									}}
								/>
							{/if}
						</div>
					</div>
				{/if}
			</label>
			<p class="text-sm text-muted-foreground">
				File size & formats are restricted as per the explicit filtering done in the Etlab android
				app.
			</p>
		</div>

		<div class="space-y-2">
			<div class="font-semibold">Your Etlab account password</div>
			<Input
				type="password"
				class="w-full"
				autocomplete="current-password"
				bind:value={userPassword}
				disabled={isUploading}
				placeholder="Your Etlab account password"
			/>
			<p class="text-sm text-muted-foreground">
				It utilizes web-access, so it requires your password to create a session, if there isn't
				one.
			</p>
		</div>
	</div>

	{#snippet footer()}
		<Button
			variant="outline"
			disabled={isUploading}
			onclick={() => {
				if (isUploading) return;

				open = false;
			}}
		>
			Cancel & go back
		</Button>
		<Button
			variant={selectedFile != null && selectedFile.size > MAX_FILE_SIZE_LIMIT
				? "destructive"
				: "default"}
			disabled={selectedFile == null || selectedFile.size > MAX_FILE_SIZE_LIMIT || isUploading}
			onclick={async () => {
				if (isUploading) return;

				isUploading = true;

				if (!(selectedFile instanceof File) || selectedFile.size === 0) {
					return toast.error("Choose a valid file first!");
				} else if (selectedFile.size > MAX_FILE_SIZE_LIMIT) {
					return toast.error("Too large to upload through Ret!");
				} else if (userPassword.length === 0) {
					return toast.error("Enter your Etlab account password!");
				}

				const form = new FormData();
				form.set("assignment", assignment.id);
				form.set("password", userPassword);
				form.set("file", selectedFile);

				function onUploadProgress(done: number, total: number) {
					uploadState = { state: "ongoing", done, total };
				}

				try {
					await new Promise((resolve, reject) => {
						const xhr = new XMLHttpRequest();
						xhr.open("POST", "/api/etlab/assignments");
						xhr.upload.onprogress = (e) =>
							e.lengthComputable && onUploadProgress(e.loaded, e.total);
						xhr.onload = () => {
							let parsed: { uploaded: true };
							try {
								parsed = JSON.parse(xhr.responseText);
							} catch {
								return reject(new Error("Couldn't parse response"));
							}

							if (parsed.uploaded === true) return resolve(parsed);

							return reject(
								new Error(
									"message" in parsed && typeof parsed.message === "string"
										? parsed.message
										: "Something went wrong!"
								)
							);
						};
						xhr.onerror = () => reject(new Error("Failed to upload! Network error!"));
						xhr.timeout = 60 * SECOND;
						xhr.ontimeout = () => reject(new Error("Time out. Try again?"));
						xhr.send(form);
					});

					open = false;

					toast.success("Uploaded successfully!", {
						description: "Let me just reload this list for you!"
					});

					await onUploadComplete();
				} catch (err) {
					toast.error("Upload failed!", {
						description: isHttpError(err)
							? err.body.message
							: err instanceof Error
								? err.message
								: "Something went wrong!"
					});
				} finally {
					isUploading = false;
				}
			}}
		>
			{#if selectedFile != null && selectedFile.size > MAX_FILE_SIZE_LIMIT}
				<WarningIcon weight="bold" />
				Too large!
			{:else if isUploading}
				<SpinnerIcon weight="bold" class="animate-spin" />
				Uploading...
				{#if uploadState.state === "ongoing"}
					{cutePercent(safeDivision(uploadState.done, uploadState.total) * 100)} &percnt;
				{/if}
			{:else}
				<UploadSimpleIcon weight="bold" />
				Submit
			{/if}
		</Button>
	{/snippet}
</Dialog>
