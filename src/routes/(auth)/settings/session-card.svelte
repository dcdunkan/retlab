<script lang="ts">
	import { DeviceType } from "$lib/prisma/browser.js";
	import LaptopIcon from "phosphor-svelte/lib/Laptop";
	import DeviceMobileIcon from "phosphor-svelte/lib/DeviceMobile";
	import QuestionIcon from "phosphor-svelte/lib/Question";
	import Button from "$lib/components/button.svelte";
	import { toast } from "svelte-sonner";
	import SpinnerIcon from "phosphor-svelte/lib/Spinner";

	let {
		session,
		showLogout = true,
		onLogout
	}: {
		session: {
			device_type: DeviceType;
			device_info: string | null;
			created_at: Date;
		};
		showLogout?: boolean;
		onLogout?: () => Promise<void>;
	} = $props();

	// todo: commonize this
	const timeFormatter = new Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
		timeStyle: "medium"
	});

	let loggingOut = $state(false);
</script>

<div class="flex justify-between gap-4 px-4 py-3">
	<div class="flex place-items-center gap-4 space-y-2">
		{#if session.device_type == DeviceType.LAPTOP}
			<LaptopIcon class="size-6" />
		{:else if session.device_type == DeviceType.MOBILE}
			<DeviceMobileIcon class="size-6" />
		{:else}
			<!-- unknown -->
			<QuestionIcon class="size-6" />
		{/if}

		<div>
			<div class="font-serif font-bold">{session.device_info}</div>
			<p class="text-sm text-muted-foreground">
				Created at <b>{timeFormatter.format(session.created_at)}</b>
			</p>
		</div>
	</div>

	{#if showLogout}
		<Button
			size={loggingOut ? "icon" : "default"}
			variant="destructive"
			shadow="none"
			disabled={loggingOut}
			onclick={async () => {
				loggingOut = true;
				try {
					await onLogout?.();
					toast.success("Logged out of account successfully");
				} catch {
					toast.error("Something went wrong");
				} finally {
					loggingOut = false;
				}
			}}
		>
			{#if loggingOut}
				<SpinnerIcon class="animate-spin" />
			{:else}
				Logout
			{/if}
		</Button>
	{/if}
</div>
