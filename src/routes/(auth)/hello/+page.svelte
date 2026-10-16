<script lang="ts">
	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
	import ArrowUUpLeftIcon from "phosphor-svelte/lib/ArrowUUpLeftIcon";
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import Button from "$lib/components/button.svelte";
	import Input from "$lib/components/input.svelte";
	import Select from "$lib/components/select.svelte";
	import { Slider } from "bits-ui";
	import { toast } from "svelte-sonner";
	import { slide } from "svelte/transition";
	import { getClientSessionUser } from "../states.svelte";
	import * as remotes from "./onboarding.remote";
	import { ONBOARDING_DATA_SCHEMA } from "./onboarding.schema";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";

	let { data } = $props();

	const sessionUser = getClientSessionUser();

	let isSaving = $state(false);
	let saveMode = $state<"skip" | "save">("save");

	const presets: {
		cutoffs: [number, number];
	}[] = [
		{ cutoffs: [75, 90] }, // 2019 ktu scheme
		{ cutoffs: [73, 90] } // 2019 ktu scheme (female students)
	];

	let onboardingForm = remotes.saveDetails.for("onboarding-form");

	onboardingForm.fields.set({
		displayName: sessionUser.account.displayName,
		semesterId: sessionUser.account.semesterId.toString(),
		attendancePercentMin: sessionUser.settings?.attendancePercentMin ?? 75,
		attendancePercentMax: sessionUser.settings?.attendancePercentMax ?? 90
	});

	let attendanceCutoffs = $derived<[number, number]>([
		onboardingForm.fields.attendancePercentMin.value() ??
			sessionUser.settings?.attendancePercentMin ??
			75,
		onboardingForm.fields.attendancePercentMax.value() ??
			sessionUser.settings?.attendancePercentMax ??
			90
	]);
	let customAttendanceCutoffMode = $derived(
		!presets.some(
			(preset) =>
				preset.cutoffs[0] === attendanceCutoffs[0] && preset.cutoffs[1] === attendanceCutoffs[1]
		)
	);

	async function skipOnboarding() {
		saveMode = "skip";
		isSaving = true;

		try {
			const toastId = toast.loading("Skipping onboarding...");
			await remotes.skipOnboarding();
			goto(resolve("/"), {
				replaceState: true
			});
			toast.dismiss(toastId);
		} catch (err) {
			console.error(err);
			toast.error("Something went wrong");
		} finally {
			isSaving = false;
		}
	}
</script>

<svelte:head>
	<title>Hello from Ret!</title>
</svelte:head>

<div>
	<div class="mt-6 font-hand text-6xl">Hello!</div>
	<div class="text-sm">
		Just some quick settings to get started. <Button
			variant="ghost"
			size="min"
			class="text-ret-accent"
			disabled={isSaving}
			onclick={async () => {
				await skipOnboarding();
			}}
		>
			{#if isSaving && saveMode === "skip"}
				Skipping...
			{:else}
				Skip, change later?
			{/if}
		</Button>
	</div>
</div>

<form
	class="space-y-6"
	{...onboardingForm.preflight(ONBOARDING_DATA_SCHEMA).enhance(async ({ submit }) => {
		saveMode = "save";
		isSaving = true;
		try {
			await submit();
			toast.success("Saved!");
		} catch (error) {
			console.error(error);
			toast.error("Oh no! Something went wrong");
		} finally {
			isSaving = false;
		}
	})}
>
	<div class="space-y-2">
		<div class="font-bold">You'll be greeted as...</div>
		<!-- <p class="text-sm">
			You can set a display name to be greeted by, in the dashboard and other places. It defaults to
			your fetched full profile name.
		</p> -->
		<Input
			disabled={isSaving}
			type="text"
			placeholder="A name to greet you"
			class="w-full"
			autocomplete="nickname"
			autocapitalize="words"
			inputmode="text"
			minlength={1}
			maxlength={24}
			required
			{...onboardingForm.fields.displayName.as("text")}
		/>

		{#each onboardingForm.fields.displayName.issues() as issue, i (i)}
			<p transition:slide class="text-sm font-medium text-error-foreground">{issue.message}</p>
		{/each}
	</div>

	<div class="space-y-2">
		<div class="font-bold">...and you're in semester...</div>

		<div class="flex w-full place-items-center">
			<Select
				type="single"
				items={data.semesters.map((semester) => ({
					value: semester.id.toString(),
					label: semester.name
				}))}
				allowDeselect={false}
				disabled={isSaving}
				placeholder="Select a semester"
				required
				class="min-w-0 flex-1 justify-between"
				name={onboardingForm.fields.semesterId.as("select").name}
				value={onboardingForm.fields.semesterId.value()}
				aria-invalid={onboardingForm.fields.semesterId.as("select")["aria-invalid"]}
				onValueChange={(value) => {
					onboardingForm.fields.semesterId.set(value);
				}}
			/>
			<!-- {...form.fields.semesterId.as("select")} -->
			<Button
				class="shrink-0"
				variant="outline"
				size="icon"
				disabled={isSaving ||
					data.sessionUser.account.semesterId.toString() ===
						onboardingForm.fields.semesterId.value()?.toString()}
				onclick={() => {
					onboardingForm.fields.semesterId.set(data.sessionUser.account.semesterId.toString());
				}}
			>
				<ArrowUUpLeftIcon weight="bold" />
			</Button>
		</div>

		{#each onboardingForm.fields.semesterId.issues() as issue, i (i)}
			<p class="text-sm font-medium text-error-foreground">{issue.message}</p>
		{/each}
	</div>

	<div class="space-y-4">
		<div class="font-bold">...and your target attendance cutoffs are</div>

		<div class="grid grid-cols-3 gap-2 text-sm">
			<div class="border-l-2 pl-2 text-error-foreground">
				<div class="font-medium">Dangerous</div>
				<div class="text-xl font-bold">Below {attendanceCutoffs[0]}%</div>
			</div>
			<div class="border-l-2 pl-2 text-success-foreground">
				<div class="font-medium">Safe</div>
				<div class="text-xl font-bold">
					{attendanceCutoffs[0]}&ndash;{attendanceCutoffs[1] - 1}%
				</div>
			</div>
			<div class="border-l-2 pl-2 text-ret-excellent-foreground">
				<div class="font-medium">Excellent</div>
				<div class="text-xl font-bold">{attendanceCutoffs[1]}%+</div>
			</div>
		</div>

		<!-- <div class="flex h-3 border-2 border-border">
			<span class="bg-ret-unsafe transition-all duration-150" style="width:{attendanceCutoffs[0]}%"
			></span>
			<span
				class="bg-ret-safe transition-all duration-150"
				style="width:{attendanceCutoffs[1] - attendanceCutoffs[0]}%"
			></span>
			<span class="flex-1 bg-ret-excellent transition-all duration-150"></span>
		</div> -->

		<Slider.Root
			max={99}
			type="multiple"
			value={attendanceCutoffs}
			onValueChange={([min, max]) => {
				customAttendanceCutoffMode = !presets.some(
					(preset) => preset.cutoffs[0] === min && preset.cutoffs[1] === max
				);
				onboardingForm.fields.attendancePercentMin.set(min);
				onboardingForm.fields.attendancePercentMax.set(max);
			}}
			class="relative flex w-full touch-none items-center select-none"
			disabled={isSaving}
		>
			<span
				class="relative h-3 w-full grow cursor-pointer overflow-hidden border-2 border-border bg-background"
			>
				<span
					class="absolute h-full bg-ret-unsafe transition-all duration-150"
					style="left: 0; right: {99 - attendanceCutoffs[0]}%"
				></span>
				<Slider.Range class="h-full bg-ret-safe transition-all duration-150" />
				<span
					class="absolute h-full bg-ret-excellent transition-all duration-150"
					style="right: 0; left: {attendanceCutoffs[1] + 1}%"
				></span>
			</span>
			<Slider.Thumb
				index={0}
				class="peer/min block size-4 cursor-pointer border-2 border-border bg-background shadow-sm"
			/>
			<Slider.ThumbLabel
				index={0}
				position="top"
				class="my-1 hidden bg-foreground/50 px-2 py-1 text-sm text-background peer-hover/min:block data-active:block"
			>
				{attendanceCutoffs[0]}
			</Slider.ThumbLabel>
			<Slider.Thumb
				index={1}
				class="peer/max block size-4 cursor-pointer border-2 border-border bg-background shadow-sm"
			/>
			<Slider.ThumbLabel
				index={1}
				position="top"
				class="my-1 hidden bg-foreground/50 px-2 py-1 text-sm text-background peer-hover/max:block data-active:block"
			>
				{attendanceCutoffs[1]}
			</Slider.ThumbLabel>
		</Slider.Root>

		<!-- hidden inputs -->
		<input
			{...onboardingForm.fields.attendancePercentMin.as("number")}
			type="hidden"
			value={attendanceCutoffs[0]}
		/>
		<input
			{...onboardingForm.fields.attendancePercentMax.as("number")}
			type="hidden"
			value={attendanceCutoffs[1]}
		/>

		<div class="flex flex-wrap gap-2">
			{#each presets as preset, i (i)}
				<Button
					type="button"
					size="sm"
					variant="outline"
					onclick={() => {
						customAttendanceCutoffMode = false;
						onboardingForm.fields.attendancePercentMin.set(preset.cutoffs[0]);
						onboardingForm.fields.attendancePercentMax.set(preset.cutoffs[1]);
					}}
				>
					{#if !customAttendanceCutoffMode && attendanceCutoffs[0] === preset.cutoffs[0] && attendanceCutoffs[1] === preset.cutoffs[1]}
						<CheckIcon weight="bold" class="text-success-foreground" />
					{/if}
					<!-- <b>{preset.label}</b> -->
					{preset.cutoffs[0]}% &ndash; {preset.cutoffs[1]}%
				</Button>
			{/each}
			<Button
				type="button"
				size="sm"
				variant="outline"
				onclick={() => {
					customAttendanceCutoffMode = true;
				}}
			>
				{#if customAttendanceCutoffMode}
					<CheckIcon weight="bold" class="text-success-foreground" />
				{/if}
				Custom
			</Button>
		</div>

		{#each onboardingForm.fields.attendancePercentMin.issues() as issue, i (i)}
			<p class="text-sm font-medium text-error-foreground">{issue.message}</p>
		{/each}

		{#each onboardingForm.fields.attendancePercentMax.issues() as issue, i (i)}
			<p class="text-sm font-medium text-error-foreground">{issue.message}</p>
		{/each}
	</div>

	<div class="space-y-2">
		<Button type="submit" class="w-full" disabled={onboardingForm.pending > 0 || isSaving}>
			{#if isSaving && saveMode == "save"}
				<SpinnerIcon class="animate-spin" /> Saving details...
			{:else}
				Save & continue <ArrowRightIcon weight="bold" />
			{/if}
		</Button>
		<Button
			type="button"
			variant="outline"
			class="w-full"
			disabled={onboardingForm.pending > 0 || isSaving}
			onclick={async () => {
				await skipOnboarding();
			}}
		>
			{#if isSaving && saveMode == "skip"}
				<SpinnerIcon class="animate-spin" /> Skipping onboarding...
			{:else}
				Skip & use defaults <ArrowRightIcon weight="bold" />
			{/if}
		</Button>
	</div>
</form>
