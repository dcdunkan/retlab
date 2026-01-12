<script lang="ts">
	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { logoutCurrentSession } from "./settings.remote";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { toast } from "svelte-sonner";
	import SpinnerIcon from "phosphor-svelte/lib/Spinner";

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	let loggingOut = $state(false);
</script>

<Dialog bind:open showCloseIcon={false} interactionOutsideBehavior="ignore">
	{#snippet trigger()}
		<DialogPrimitive.Trigger class={buttonVariants({ variant: "destructive" })}>
			Logout
		</DialogPrimitive.Trigger>
	{/snippet}

	{#snippet title()}
		Logout account
	{/snippet}

	{#snippet description()}
		Are you sure?
	{/snippet}

	{#snippet footer()}
		<Button
			disabled={loggingOut}
			variant="outline"
			shadow="none"
			onclick={() => {
				open = false;
			}}
		>
			Cancel
		</Button>
		<Button
			size={loggingOut ? "icon" : "default"}
			variant="destructive"
			shadow="none"
			disabled={loggingOut}
			onclick={async () => {
				loggingOut = true;
				const { logout } = await logoutCurrentSession();
				if (logout) {
					goto(resolve("/login"));
				} else {
					toast.error("Something went wrong");
					window.location.reload();
				}
			}}
		>
			{#if loggingOut}
				<SpinnerIcon class="animate-spin" />
			{:else}
				Logout session
			{/if}
		</Button>
	{/snippet}
</Dialog>
