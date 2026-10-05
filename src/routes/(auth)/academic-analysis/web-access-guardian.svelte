<script lang="ts">
	import FingerprintSimpleIcon from "phosphor-svelte/lib/FingerprintSimpleIcon";
	import SmileyIcon from "phosphor-svelte/lib/SmileyIcon";
	import SmileyXEyesIcon from "phosphor-svelte/lib/SmileyXEyesIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import Input from "$lib/components/input.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { toast } from "svelte-sonner";
	import { authenticateWebSession } from "../settings/web-access.remote";

	let {
		open = $bindable(false),
		onClose
	}: {
		open?: boolean;
		onClose: () => Promise<void>;
	} = $props();

	let isAuthenticating = $state(false);

	let showPassword = $state(false);
	let password = $state("");
</script>

<Dialog
	bind:open
	showCloseIcon={false}
	interactOutsideBehavior="ignore"
	onOpenChangeComplete={async (open) => {
		if (!open) await onClose();
	}}
>
	{#snippet title()}
		Authenticate web-access session
	{/snippet}

	{#snippet description()}
		Enter your Etlab account password to create a new web-access session.
	{/snippet}

	<div class="mt-2 space-y-3">
		<div class="flex w-full items-center justify-center gap-2">
			<Input
				type={showPassword ? "text" : "password"}
				bind:value={password}
				placeholder="Etlab account password"
				class="w-full"
				autocomplete="current-password"
			/>
			<!-- todo: sad-to-happy password strength smiley reactions -->
			<Button variant="ghost" size="icon-lg" onclick={() => (showPassword = !showPassword)}>
				{#if showPassword}
					<SmileyIcon class="size-7" />
				{:else}
					<SmileyXEyesIcon class="size-7" />
				{/if}
			</Button>
		</div>

		<!-- <p class="text-center text-sm text-muted-foreground">
				Passcode can only contain letters and digits, must be 6 characters long, and it is
				case-insensitive (small or caps = all the same).
			</p> -->

		<box.Warning>
			By clicking <b>"Authenticate"</b>, you agree to let Ret login to Etlab to obtain your session
			token by using the entered password (without storing or logging it anywhere).
		</box.Warning>
	</div>

	{#snippet footer()}
		<Button
			disabled={isAuthenticating}
			variant="outline"
			onclick={() => {
				window.history.back();
			}}
		>
			Cancel & go back
		</Button>
		<Button
			disabled={isAuthenticating}
			onclick={async () => {
				isAuthenticating = true;
				try {
					await authenticateWebSession({ password });
					open = false;
				} catch (err) {
					if (isHttpError(err)) {
						toast.error(err.body.message);
					} else {
						toast.error("Something went wrong!");
					}
				} finally {
					isAuthenticating = false;
				}
			}}
		>
			{#if isAuthenticating}
				<SpinnerIcon class="animate-spin" weight="bold" /> Might take a while...
			{:else}
				<FingerprintSimpleIcon /> Authenticate
			{/if}
		</Button>
	{/snippet}
</Dialog>
