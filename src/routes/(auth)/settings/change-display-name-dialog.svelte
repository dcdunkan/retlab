<script lang="ts">
	import IdentificationCardIcon from "phosphor-svelte/lib/IdentificationCardIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import Button from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import Input from "$lib/components/input.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { toast } from "svelte-sonner";
	import { getClientSessionUser } from "../states.svelte";
	import * as remotes from "./settings.remote";

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	let sessionUser = getClientSessionUser();

	let isChanging = $state(false);

	let displayName = $state(sessionUser.account.displayName);
</script>

<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
	{#snippet title()}
		Change your display name
	{/snippet}

	{#snippet description()}
		What do you want to be called?
	{/snippet}

	<div class="space-y-3 p-1">
		<Input
			disabled={isChanging}
			type="text"
			bind:value={displayName}
			placeholder="A name to greet you"
			class="w-full"
			autocomplete="off"
			autocapitalize="words"
			inputmode="text"
			minlength={1}
			maxlength={24}
		/>
		<p class="text-sm text-muted-foreground">Display names can be 1-24 characters long.</p>
	</div>

	{#snippet footer()}
		<Button
			disabled={isChanging}
			variant="outline"
			onclick={() => {
				if (isChanging) return;
				open = false;
			}}
		>
			Close
		</Button>
		<Button
			disabled={displayName.trim().length === 0 ||
				sessionUser.account.displayName === displayName ||
				isChanging}
			onclick={async () => {
				if (isChanging) return;

				isChanging = true;
				try {
					const changed = await remotes.changeAccountDisplayName({
						displayName: displayName
					});
					sessionUser.account.displayName = changed.displayName;
					open = false;
					toast.success("Display name changed!");
				} catch (err) {
					if (isHttpError(err)) {
						toast.error(err.body.message);
					} else {
						toast.error("Something went wrong!");
					}
				} finally {
					isChanging = false;
				}
			}}
		>
			{#if isChanging}
				<SpinnerIcon class="animate-spin" weight="bold" /> Changing name tags...
			{:else}
				<IdentificationCardIcon /> Change me!
			{/if}
		</Button>
	{/snippet}
</Dialog>
