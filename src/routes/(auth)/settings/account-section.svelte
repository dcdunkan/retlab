<script lang="ts">
	import Button from "$lib/components/button.svelte";
	import Timestamp from "$lib/components/timestamp.svelte";
	import { getClientSessionUser } from "../states.svelte";
	import ChangeDisplayNameDialog from "./change-display-name-dialog.svelte";
	import DestroyAccountDialog from "./destroy-account-dialog.svelte";
	import LogoutDialog from "./logout-dialog.svelte";

	let sessionUser = getClientSessionUser();

	let changeDisplayNameDialogOpen = $state(false);
</script>

<section class="space-y-4">
	<h2 class="sticky top-10 z-49 -mx-4 bg-background/75 px-4 py-2 text-2xl italic">Account</h2>

	<div class="divide-y-2 divide-border border-2 border-border">
		<div class="flex justify-between gap-4 px-4 py-3">
			<div class="space-y-2">
				<div>
					<div class="font-bold">Display name</div>
					{#if sessionUser.account.profileName === sessionUser.account.displayName}
						<p class="text-sm font-medium text-warning-foreground">
							Same as profile name: <b>{sessionUser.account.profileName}</b>
						</p>
					{:else}
						<p class="text-sm font-medium text-ret-accent">
							Currently set to <b>{sessionUser.account.displayName}</b>
						</p>
					{/if}
				</div>

				<p class="text-sm">
					You can set a display name to be greeted by, in the dashboard and other places. It
					defaults to your fetched full profile name.
				</p>
			</div>

			<Button
				size="sm"
				onclick={() => {
					changeDisplayNameDialogOpen = true;
				}}
			>
				Change
			</Button>
		</div>

		<div class="flex justify-between gap-4 px-4 py-3">
			<div class="space-y-2">
				<div>
					<div class="font-bold">Logout from your account</div>
					<p class="text-sm font-medium text-ret-accent">
						You logged in <Timestamp
							timestamp={sessionUser.session.createdAt}
							class="font-medium"
							dateTimeFormatOptions={{
								dateStyle: "medium",
								timeStyle: "medium"
							}}
						/>
					</p>
				</div>

				<p class="text-sm">
					This does <b>not</b> really log out your account session from Etlab btw. But, you log out from
					Retlab, and Retlab WILL call the logout route of Etlab's API, but it doesn't seem to have any
					real effect (meaning, your access token is still valid).
				</p>
			</div>
			<LogoutDialog />
		</div>

		<div class="flex justify-between gap-4 px-4 py-3">
			<div class="space-y-2">
				<div>
					<div class="font-bold">Destroy your account</div>
				</div>
				<p class="text-sm">
					Delete your Retlab account, and everything with it. This doesn't do anything to your
					actual Etlab account.
				</p>
			</div>
			<DestroyAccountDialog />
		</div>
	</div>
</section>

<ChangeDisplayNameDialog bind:open={changeDisplayNameDialogOpen} />
