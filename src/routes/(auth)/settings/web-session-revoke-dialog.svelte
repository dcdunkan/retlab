<script lang="ts">
	import ReceiptXIcon from "phosphor-svelte/lib/ReceiptXIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import Button, { buttonVariants } from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import Textarea from "$lib/components/textarea.svelte";
	import { isHttpError } from "@sveltejs/kit";
	import { Dialog as DialogPrimitive } from "bits-ui";
	import { toast } from "svelte-sonner";
	import { type getMyWebSessions, revokeWebSession } from "./web-access.remote";

	let {
		open = $bindable(false),
		webSessionId,
		webSessions = $bindable()
	}: {
		open?: boolean;
		webSessionId: string;
		webSessions: NonNullable<Awaited<ReturnType<typeof getMyWebSessions>>>;
	} = $props();

	let isRevoking = $state(false);

	let reason = $state("");
</script>

<Dialog bind:open showCloseIcon={false} interactOutsideBehavior="ignore">
	{#snippet trigger()}
		<DialogPrimitive.Trigger
			class={buttonVariants({
				variant: "destructive",
				size: "sm"
			})}
		>
			<ReceiptXIcon weight="bold" /> Revoke
		</DialogPrimitive.Trigger>
	{/snippet}

	{#snippet title()}
		Revoke active web-session?
	{/snippet}

	{#snippet description()}
		Are you really sure?
	{/snippet}

	<div class="space-y-4 p-2">
		<p>
			You'll just have to re-authenticate with your passcode to start a new session if you need to
			use any web feature.
		</p>

		<Textarea
			bind:value={reason}
			placeholder="Enter a short text as reason"
			rows={3}
			maxlength={80}
		/>
	</div>

	{#snippet footer()}
		<Button disabled={isRevoking} variant="outline" onclick={() => (open = false)}>Cancel</Button>
		<Button
			variant="destructive"
			disabled={isRevoking}
			onclick={async () => {
				if (isRevoking) return;
				isRevoking = true;
				try {
					const revoked = await revokeWebSession({
						id: webSessionId,
						reason: reason
					});
					open = false;
					const index = webSessions.active.findIndex((s) => s.id === webSessionId);
					if (index >= 0) webSessions.active.splice(index, 1);
					// console.log(index, webSessions.active);
					// console.log(webSessions.expired.length);
					webSessions.expired.unshift(revoked);
					// console.log(webSessions.expired.length, webSessions.expired);
				} catch (error) {
					console.log(error);
					toast.error(isHttpError(error) ? error.body.message : "Something went wrong.");
				} finally {
					isRevoking = false;
				}
			}}
		>
			{#if isRevoking}
				<SpinnerIcon class="animate-spin" /> Revoking...
			{:else}
				Revoke this session
			{/if}
		</Button>
	{/snippet}
</Dialog>
