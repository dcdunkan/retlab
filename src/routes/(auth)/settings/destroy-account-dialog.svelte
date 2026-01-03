<script lang="ts">
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import SpinnerIcon from "phosphor-svelte/lib/Spinner";
	import { toast } from "svelte-sonner";
	import { destroyAccount } from "./settings.remote";

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	let destroying = $state(false);
</script>

<Dialog bind:open showCloseIcon={false} interactionOutsideBehavior="ignore">
	{#snippet trigger()}
		<DialogPrimitive.Trigger class={buttonVariants({ variant: "destructive" })}>
			DESTROY
		</DialogPrimitive.Trigger>
	{/snippet}

	{#snippet title()}
		Destroy account
	{/snippet}

	{#snippet description()}
		Are you really sure?
	{/snippet}

	<p>
		This will delete all the sessions, settings and data along with the Retlab account. This has
		nothing to do with your Etlab account. It affects it in no way.
	</p>

	{#snippet footer()}
		<Button disabled={destroying} variant="outline" shadow="none" onclick={() => (open = false)}>
			Cancel
		</Button>
		<Button
			variant="destructive"
			shadow="none"
			disabled={destroying}
			onclick={async () => {
				destroying = true;
				const { logout } = await destroyAccount();
				if (logout) {
					goto(resolve("/login"));
				} else {
					toast.error("Something went wrong");
					window.location.reload();
				}
			}}
		>
			{#if destroying}
				<SpinnerIcon class="animate-spin" />
			{:else}
				Destrooyyy!
			{/if}
		</Button>
	{/snippet}
</Dialog>
