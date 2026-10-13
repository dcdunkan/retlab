<script lang="ts">
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import SignOutIcon from "phosphor-svelte/lib/SignOutIcon";

	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { logoutCurrentSession } from "./settings.remote";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { toast } from "svelte-sonner";

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	let loggingOut = $state(false);
</script>

<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
	{#snippet trigger()}
		<DialogPrimitive.Trigger class={buttonVariants({ variant: "destructive", size: "sm" })}>
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
			onclick={() => {
				open = false;
			}}
		>
			Cancel
		</Button>
		<Button
			variant="destructive"
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
				<SpinnerIcon class="animate-spin" /> Logging you out...
			{:else}
				<SignOutIcon weight="bold" /> Logout session
			{/if}
		</Button>
	{/snippet}
</Dialog>
