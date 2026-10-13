<script lang="ts">
	import Button from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import { toast } from "svelte-sonner";
	import type { ParsedAssignmentWithResults } from "./assignments/+page.svelte";
	import { deleteAssignment } from "./assignments/assignments.remote";
	import Input from "$lib/components/input.svelte";

	let {
		open = $bindable(false),
		assignment,
		onDeleteComplete
	}: {
		open?: boolean;
		assignment: ParsedAssignmentWithResults;
		onDeleteComplete: () => Promise<void>;
	} = $props();

	let deleting = $state(false);

	let userPassword = $state("");
</script>

<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
	{#snippet title()}
		Delete assignment
	{/snippet}

	{#snippet description()}
		Are you really sure?
	{/snippet}

	<div class="space-y-4 p-1">
		<p>
			<b>This will delete your submission forever</b>, and you might not be able to re-upload if
			it's already past the last date.
		</p>

		<div class="space-y-2">
			<div class="font-semibold">Your Etlab account password</div>
			<Input
				type="password"
				class="w-full"
				autocomplete="current-password"
				bind:value={userPassword}
				disabled={deleting}
				placeholder="Your Etlab account password"
			/>
			<p class="text-sm text-muted-foreground">
				It utilizes web-access, so it requires your password to create a session, if there isn't
				one.
			</p>
		</div>
	</div>

	{#snippet footer()}
		<Button
			disabled={deleting}
			variant="outline"
			onclick={() => {
				if (deleting) return;
				open = false;
			}}
		>
			Cancel
		</Button>
		<Button
			variant="destructive"
			disabled={deleting}
			onclick={async () => {
				if (deleting) return;

				deleting = true;

				try {
					await deleteAssignment({
						assignmentId: assignment.id,
						password: userPassword
					});
					toast.success("Deleted assignment successfully!", {
						description: "Let's just refresh this assignment list!"
					});
					open = false;
					await onDeleteComplete();
				} catch (err) {
					if (isHttpError(err)) {
						toast.error(err.body.message);
					} else {
						toast.error("Something went wrong!");
					}
				} finally {
					deleting = false;
				}
			}}
		>
			{#if deleting}
				<SpinnerIcon class="animate-spin" /> Deleting...
			{:else}
				Delete assignment
			{/if}
		</Button>
	{/snippet}
</Dialog>
