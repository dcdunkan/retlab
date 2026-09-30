<script lang="ts">
	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import { disableWebAccess, getMyWebSessions } from "./web-access.remote";
	import { webAccessSettingsState } from "../states.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { toast } from "svelte-sonner";

	let {
		open = $bindable(false),
		webSessions = $bindable()
	}: {
		open?: boolean;
		webSessions: Awaited<ReturnType<typeof getMyWebSessions>> | undefined;
	} = $props();

	let isDisabling = $state(false);
</script>

<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
	{#snippet trigger()}
		<DialogPrimitive.Trigger
			disabled={webSessions == null}
			class={buttonVariants({
				variant: "destructive",
				size: "sm"
			})}
		>
			Disable
		</DialogPrimitive.Trigger>
	{/snippet}

	{#snippet title()}
		Disable web-access
	{/snippet}

	{#snippet description()}
		Are you really sure?
	{/snippet}

	<p>
		This will revoke any currently active web sessions and delete web access related settings like
		the stored encrypted password.
	</p>

	{#snippet footer()}
		<Button disabled={isDisabling} variant="outline" onclick={() => (open = false)}>Cancel</Button>
		<Button
			variant="destructive"
			disabled={isDisabling}
			onclick={async () => {
				if (isDisabling) return;
				isDisabling = true;
				try {
					await disableWebAccess();
					webAccessSettingsState.set(null);
					if (webSessions != null && webSessions.active.length > 0) {
						webSessions.expired.unshift(
							...webSessions.active.map((activeWs) => ({
								...activeWs,
								revokedAt: new Date(),
								revokedReason: null
							}))
						);
						webSessions.active = [];
					}
					open = false;
				} catch (error) {
					toast.error(isHttpError(error) ? error.body.message : "Something went wrong.");
				} finally {
					isDisabling = false;
				}
			}}
		>
			{#if isDisabling}
				<SpinnerIcon class="animate-spin" /> Disabling...
			{:else}
				Disable web-access
			{/if}
		</Button>
	{/snippet}
</Dialog>
