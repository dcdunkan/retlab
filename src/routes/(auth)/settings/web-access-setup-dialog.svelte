<script lang="ts">
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import GlobeIcon from "phosphor-svelte/lib/GlobeIcon";
	import SmileyIcon from "phosphor-svelte/lib/SmileyIcon";
	import SmileyXEyesIcon from "phosphor-svelte/lib/SmileyXEyesIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import box from "$lib/components/box";
	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import PinInput from "$lib/components/pin-input.svelte";
	import { Dialog as DialogPrimitive, REGEXP_ONLY_DIGITS_AND_CHARS } from "bits-ui";
	import { getMyWebSessions, setupWebAccess } from "./web-access.remote";
	import { isHttpError } from "@sveltejs/kit";
	import { toast } from "svelte-sonner";
	import { webAccessSettingsState } from "../states.svelte";

	let {
		open = $bindable(false),
		disabled = true,
		password,
		webSessions = $bindable()
	}: {
		open?: boolean;
		disabled: boolean;
		password: string;
		webSessions: Awaited<ReturnType<typeof getMyWebSessions>> | undefined;
	} = $props();

	let isSettingUp = $state(false);

	let showPasscode = $state(false);

	let passcode = $state("");
</script>

<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
	{#snippet trigger()}
		<DialogPrimitive.Trigger class={buttonVariants()} {disabled}>
			<GlobeIcon weight="bold" /> Enable web-access
		</DialogPrimitive.Trigger>
	{/snippet}

	{#snippet title()}
		Enable web-access
	{/snippet}

	{#snippet description()}
		Enter passcode to setup web-access. This won't be stored anywhere, and only you know it.
	{/snippet}

	<div class="space-y-3 p-2">
		<div class="flex w-full items-center justify-center gap-2">
			<PinInput
				type="text"
				inputmode="text"
				hide={!showPasscode}
				maxlength={6}
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
				class="w-fit uppercase"
				bind:value={passcode}
			/>
			<!-- todo: sad-to-happy password strength smiley reactions -->
			<Button variant="ghost" size="icon-lg" onclick={() => (showPasscode = !showPasscode)}>
				{#if showPasscode}
					<SmileyIcon class="size-7" />
				{:else}
					<SmileyXEyesIcon class="size-7" />
				{/if}
			</Button>
		</div>

		<p class="text-center text-sm text-muted-foreground">
			Passcode can only contain letters and digits, must be 6 characters long, and it is
			case-insensitive (small or caps = all the same).
		</p>

		<box.Warning>
			By clicking <b>"Set up"</b>, you agree to let Ret store your Etlab account password in an
			encrypted format, only decryptable upon you entering the same passcode when needed.
		</box.Warning>
	</div>

	{#snippet footer()}
		<Button disabled={isSettingUp} variant="outline" onclick={() => (open = false)}>Cancel</Button>
		<Button
			disabled={isSettingUp}
			onclick={async () => {
				isSettingUp = true;
				try {
					const { setupAt, webSession: newWebSession } = await setupWebAccess({
						passcode: passcode,
						password: password
					});
					open = false;
					webAccessSettingsState.set({
						setupAt: setupAt
					});
					if (webSessions != null) webSessions.active = [newWebSession];
				} catch (err) {
					if (isHttpError(err)) {
						toast.error(err.body.message);
					} else {
						toast.error("Something went wrong!");
					}
				} finally {
					isSettingUp = false;
				}
			}}
		>
			{#if isSettingUp}
				<SpinnerIcon class="animate-spin" weight="bold" /> Might take a while...
			{:else}
				<CheckIcon /> Set up
			{/if}
		</Button>
	{/snippet}
</Dialog>
