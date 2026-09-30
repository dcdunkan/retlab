<script lang="ts">
	import FingerprintSimpleIcon from "phosphor-svelte/lib/FingerprintSimpleIcon";
	import SmileyIcon from "phosphor-svelte/lib/SmileyIcon";
	import SmileyXEyesIcon from "phosphor-svelte/lib/SmileyXEyesIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import box from "$lib/components/box";
	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import PinInput from "$lib/components/pin-input.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { Dialog as DialogPrimitive, REGEXP_ONLY_DIGITS_AND_CHARS } from "bits-ui";
	import { toast } from "svelte-sonner";
	import { authenticateWebAccess, getMyWebSessions } from "./web-access.remote";

	let {
		open = $bindable(false),
		webSessions = $bindable()
	}: {
		open?: boolean;
		webSessions: NonNullable<Awaited<ReturnType<typeof getMyWebSessions>>>;
	} = $props();

	let isAuthenticating = $state(false);

	let showPasscode = $state(false);
	let passcode = $state("");
</script>

<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
	{#snippet trigger()}
		<DialogPrimitive.Trigger class={buttonVariants({ variant: "outline", size: "sm" })}>
			<FingerprintSimpleIcon weight="bold" /> Authenticate web-access
		</DialogPrimitive.Trigger>
	{/snippet}

	{#snippet title()}
		Authenticate web-access
	{/snippet}

	{#snippet description()}
		Enter passcode to authenticate web-access. If you forgot your passcode, disable & set-up
		web-access again.
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

		<!-- <p class="text-center text-sm text-muted-foreground">
			Passcode can only contain letters and digits, must be 6 characters long, and it is
			case-insensitive (small or caps = all the same).
		</p> -->

		<box.Warning>
			By clicking <b>"Authenticate"</b>, you agree to let Ret login to Etlab to obtain your session
			token by decrypting your stored encrypted password using your passcode.
		</box.Warning>
	</div>

	{#snippet footer()}
		<Button disabled={isAuthenticating} variant="outline" onclick={() => (open = false)}
			>Cancel</Button
		>
		<Button
			disabled={isAuthenticating}
			onclick={async () => {
				isAuthenticating = true;
				try {
					const newWSession = await authenticateWebAccess(passcode);
					open = false;
					webSessions.expired.unshift(
						...webSessions.active.map((activeWs) => ({
							...activeWs,
							revokedAt: newWSession.requestedAt,
							revokedReason: null
						}))
					);
					webSessions.active = [newWSession];
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
