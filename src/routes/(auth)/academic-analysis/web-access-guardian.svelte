<script lang="ts">
	import FingerprintSimpleIcon from "phosphor-svelte/lib/FingerprintSimpleIcon";
	import SmileyIcon from "phosphor-svelte/lib/SmileyIcon";
	import SmileyXEyesIcon from "phosphor-svelte/lib/SmileyXEyesIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import { resolve } from "$app/paths";
	import box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import PinInput from "$lib/components/pin-input.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { REGEXP_ONLY_DIGITS_AND_CHARS } from "bits-ui";
	import { toast } from "svelte-sonner";
	import { authenticateWebAccess } from "../settings/web-access.remote";
	import { webAccessSettingsState } from "../states.svelte";

	let {
		open = $bindable(false),
		onClose
	}: {
		open?: boolean;
		onClose: () => Promise<void>;
	} = $props();

	let isAuthenticating = $state(false);

	let showPasscode = $state(false);
	let passcode = $state("");
</script>

{#if webAccessSettingsState.resolved}
	{#if webAccessSettingsState.value == null}
		<box.Error>
			This is a web-access only feature. You haven't setup web access for your Ret account yet. See
			<a
				tabindex="-1"
				class="font-medium underline hover:text-ret-accent"
				href={resolve("/settings")}
			>
				/settings
			</a> to set it up.
		</box.Error>
	{:else}
		<Dialog
			bind:open
			showCloseIcon={false}
			interactOutsideBehavior="ignore"
			onOpenChangeComplete={async (open) => {
				if (!open) await onClose();
			}}
		>
			{#snippet title()}
				Authenticate web-access
			{/snippet}

			{#snippet description()}
				Enter passcode to authenticate web-access. If you forgot your passcode, disable & set-up
				web-access in
				<a class="font-medium underline hover:text-ret-accent" href={resolve("/settings")}>
					/settings
				</a>.
			{/snippet}

			<div class="mt-2 space-y-3">
				<div class="flex w-full items-center justify-center gap-2">
					<PinInput
						hide={!showPasscode}
						maxlength={6}
						type="text"
						inputmode="text"
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

				<!-- <p class="text-center text-sm text-muted-foreground">
				Passcode can only contain letters and digits, must be 6 characters long, and it is
				case-insensitive (small or caps = all the same).
			</p> -->

				<box.Warning>
					By clicking <b>"Authenticate"</b>, you agree to let Ret login to Etlab to obtain your
					session token by decrypting your stored encrypted password using your passcode.
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
							await authenticateWebAccess(passcode);
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
	{/if}
{:else}
	<box.Loading>Loading web-access settings...</box.Loading>
{/if}
