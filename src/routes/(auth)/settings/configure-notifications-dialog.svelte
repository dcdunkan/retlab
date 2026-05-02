<script lang="ts">
	import ArrowUUpLeftIcon from "phosphor-svelte/lib/ArrowUUpLeftIcon";
	import FloppyDiskBackIcon from "phosphor-svelte/lib/FloppyDiskBackIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import XCircleIcon from "phosphor-svelte/lib/XCircleIcon";

	import { unsubscribeLocally } from "$lib/browser";
	import Box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import Checkbox from "$lib/components/checkbox.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import Switch from "$lib/components/switch.svelte";
	import { ErrorCodes } from "$lib/errors";
	import { LoadState } from "$lib/types";
	import { isHttpError } from "@sveltejs/kit";
	import { toast } from "svelte-sonner";
	import { SvelteSet } from "svelte/reactivity";
	import { getConfiguration, setConfiguration } from "./notifications.remote";

	let {
		open = $bindable(false)
	}: {
		open?: boolean;
	} = $props();

	type ReturnedConfiguration = NonNullable<ReturnType<typeof getConfiguration>["current"]>;

	let changedConfig = $state<{
		config: Record<string, ReturnedConfiguration["serverConfig"]["config"][string]["defaultValue"]>;
		channels: Record<string, SvelteSet<string>>; // note to myself: use ssvelteset always, even inside proxied objects!
	}>();

	let configuration = $state<
		| { state: LoadState.Pending }
		| { state: LoadState.Resolved; data: ReturnedConfiguration }
		| { state: LoadState.Rejected; message: string; errorData?: unknown }
	>({ state: LoadState.Pending });

	$effect(() => {
		if (configuration.state !== LoadState.Resolved) {
			changedConfig = undefined;
			return;
		}
		const data = configuration.data;
		changedConfig = {
			config: Object.entries(data.serverConfig.config).reduce(
				(p, [key, option]) => {
					p[key] = data.overriddenConfig[key] ?? option.defaultValue;
					return p;
				},
				{} as Record<string, NonNullable<typeof changedConfig>["config"][string]>
			),
			channels: Object.entries(data.subscribedChannels).reduce(
				(p, [tag, items]) => {
					p[tag] = new SvelteSet<string>();
					for (const item of items) p[tag].add(item); // make a cheap copy
					return p;
				},
				{} as Record<string, SvelteSet<string>>
			)
		};
	});

	$effect(() => {
		if (open) {
			configuration = { state: LoadState.Pending };
			getConfiguration()
				.then((config) => {
					configuration = { state: LoadState.Resolved, data: config };
				})
				.catch((err) => {
					if (isHttpError(err)) {
						if (err.body.code === ErrorCodes.NotificationServer.RESPONSE_MISMATCH) {
							if (err.body.errors != null && err.body.errors.type === "schema-mismatch") {
								configuration = {
									state: LoadState.Rejected,
									message: err.body.message,
									errorData: err.body.errors.input
								};
								return;
							}
						}
						configuration = {
							state: LoadState.Rejected,
							message: err.body.message
						};
					} else {
						configuration = {
							state: LoadState.Rejected,
							message: "Failed to fetch server configuration"
						};
					}
				});
		} else {
			changedConfig = undefined;
		}
	});

	let hasChanged = $derived.by<boolean>(() => {
		if (configuration.state !== LoadState.Resolved || changedConfig == null) return false;

		for (const channelTag in configuration.data.serverConfig.channels) {
			const current = changedConfig.channels[channelTag];
			const previous = configuration.data.subscribedChannels[channelTag];

			if (previous == null && current == null) {
				// if both are equal then don't care.
				continue;
			}
			if (previous != null && previous.length > 0 && (current == null || current.size === 0)) {
				// previously subscribed to some items, but doesn't subscribe to anything now
				return true;
			}
			if (current != null && current.size > 0 && (previous == null || previous.length === 0)) {
				// previously did not subscribe to any items, but now does.
				return true;
			}
			if (previous.length !== current.size) {
				// something changed.
				return true;
			}
			if (new Set(previous).symmetricDifference(current).size !== 0) {
				// a new subscribed item, or an unsubscried item
				return true;
			}
		}

		for (const key in changedConfig.config) {
			if (key in configuration.data.overriddenConfig) {
				// user has overridden it before, so, just check if it has changed.
				const overridden = configuration.data.overriddenConfig[key];
				if (overridden !== changedConfig.config[key]) {
					return true;
				}
			} else {
				// user has not overriden it yet, so check if its the same as the default value.
				const defaultValue = configuration.data.serverConfig.config[key].defaultValue;
				if (defaultValue !== changedConfig.config[key]) {
					return true;
				}
			}
		}

		return false;
	});

	let isSavingChanges = $state(false);
	let saveErrors = $state<Record<string, string[]>>({});
</script>

<Dialog bind:open showCloseIcon={false} enableBorders={false} interactOutsideBehavior="ignore">
	{#snippet title()}
		Configure Notifications
	{/snippet}

	{#snippet description()}
		You can adjust your notification settings here.
	{/snippet}

	{#if configuration.state === LoadState.Pending}
		<Box.Loading>Fetching *fresh* schema from server...</Box.Loading>
	{:else if configuration.state === LoadState.Resolved && changedConfig != null}
		<div class="space-y-4">
			<p class="border-2 bg-muted px-3 py-2 text-sm">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				If you are facing any issues with the notification server, try contacting the host of the server
				at
				<a
					href={configuration.data.serverConfig.contact}
					class="text-primary underline hover:text-blue-500"
				>
					<b>{configuration.data.serverConfig.contact}</b>
				</a>.
			</p>

			<div class="space-y-3">
				<div>
					<div class="text-lg font-bold">Notification Channels</div>
					<p class="text-sm">
						You can choose which channels you want to subscribe to, and you should start recieving
						notifications according to that.
					</p>
				</div>

				<div class="space-y-2">
					{#each Object.entries(configuration.data.serverConfig.channels) as [channelTag, channel] (channelTag)}
						<div class="space-y-2">
							<div>
								<div class="text-sm font-bold text-muted-foreground uppercase">{channel.name}</div>
								{#if channel.description}
									<p class="text-sm">{channel.description}</p>
								{/if}
							</div>
							<div class="divide-y-2 border-2 bg-muted">
								{#each Object.entries(channel.items) as [channelItemId, channelItem] (channelItemId)}
									<div class="flex place-items-start justify-between gap-2 px-3 py-2">
										<div class="text-sm">
											<div
												class={channelItem.active
													? "font-semibold"
													: "font-bold text-muted-foreground"}
											>
												{channelItem.name}
												{#if !channelItem.active}
													(inactive)
												{/if}
											</div>
											<p class="text-muted-foreground">
												{channelItem.description}
											</p>
										</div>
										<Checkbox
											class="mt-1.5"
											disabled={!channelItem.active}
											checked={changedConfig.channels[channelTag]?.has(channelItemId)}
											onCheckedChange={(checked) => {
												if (changedConfig == null) return;
												if (checked) {
													changedConfig.channels[channelTag] ??= new SvelteSet();
													changedConfig.channels[channelTag].add(channelItemId);
												} else {
													if (changedConfig.channels[channelTag] == null) return;
													changedConfig.channels[channelTag].delete(channelItemId);
													if (changedConfig.channels[channelTag].size === 0) {
														delete changedConfig.channels[channelTag];
													}
												}
											}}
										/>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="space-y-3">
				<div>
					<div class="text-lg font-bold">Additional Configuration</div>
					<p class="text-sm">
						Some other stuff that you can configure to alter the notification server behavior.
					</p>
				</div>

				<div class="divide-y-2 border-2 bg-muted">
					{#each Object.entries(configuration.data.serverConfig.config) as [optionKey, option] (optionKey)}
						<div id="notconf-option-{optionKey}" class="space-y-1 px-3 py-2">
							<div class="flex place-items-start justify-between gap-2">
								<div class="text-sm">
									<div class="font-semibold">{option.name}</div>
									<p class="text-muted-foreground">
										<i class="font-medium">
											{#if option.type === "boolean"}
												Defaults to {option.defaultValue}.
											{:else if option.type === "integer"}
												Defaults to {option.defaultValue}.
											{:else}
												<Box.Error>Unknown type of option</Box.Error>
											{/if}
										</i>

										{option.description}
									</p>
								</div>

								<Button
									variant="ghost"
									size="icon-sm"
									shadow="none"
									disabled={changedConfig.config[optionKey] === option.defaultValue}
									onclick={() => {
										if (changedConfig == null) return;
										changedConfig.config[optionKey] = option.defaultValue;
										if (optionKey in saveErrors) delete saveErrors[optionKey];
									}}
								>
									<ArrowUUpLeftIcon weight="bold" />
								</Button>
							</div>

							<div>
								{#if option.type === "boolean"}
									{#if typeof changedConfig.config[optionKey] === "boolean"}
										<Switch
											bind:checked={changedConfig.config[optionKey]}
											onCheckedChange={() => {
												if (optionKey in saveErrors) delete saveErrors[optionKey];
											}}
										/>
									{:else}
										<Box.Error>Was supposed to be a switch, but the values are messed up.</Box.Error
										>
									{/if}
								{:else if option.type === "integer"}
									<input
										id="nots-config:{optionKey}"
										class="w-full p-1 text-sm"
										type="number"
										step={1}
										min={option.min}
										max={option.max}
										defaultValue={option.defaultValue}
										bind:value={changedConfig.config[optionKey]}
										onchange={() => {
											if (optionKey in saveErrors) delete saveErrors[optionKey];
										}}
									/>
								{:else}
									<Box.Error>Unknown kind</Box.Error>
								{/if}
							</div>

							{#if saveErrors[optionKey] != null}
								{#each saveErrors[optionKey] as e, i (i)}
									<p class="text-sm font-semibold text-red-600">{e}</p>
								{/each}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else if configuration.state === LoadState.Rejected}
		<Box.Error>Failed to fetch server configuration</Box.Error>
		{#if configuration.errorData != null}
			<details class="mt-1">
				<summary class="py-1 text-sm">
					<b>Debug info</b> (for the host of the notification server)
				</summary>
				<div class="overflow-x-auto border bg-muted">
					<pre class="p-1 font-mono text-xs">{JSON.stringify(
							configuration.errorData,
							null,
							4
						)}</pre>
				</div>
			</details>
		{/if}
	{/if}

	{#snippet footer()}
		<Button
			disabled={isSavingChanges}
			variant={hasChanged ? "destructive" : "outline"}
			onclick={() => (open = false)}
		>
			<XCircleIcon weight="bold" />
			{#if hasChanged}
				Discard changes &AMP; close
			{:else}
				Close
			{/if}
		</Button>
		<Button
			disabled={isSavingChanges || !hasChanged}
			onclick={async () => {
				if (configuration.state !== LoadState.Resolved || changedConfig == null) return;

				isSavingChanges = true;
				const toastId = toast.loading("Saving configuration");

				try {
					await setConfiguration({
						config: changedConfig.config,
						channels: Object.fromEntries(
							Object.entries(changedConfig.channels).map(([tag, items]) => [tag, Array.from(items)])
						)
					});
					toast.success("Configuration saved!", { id: toastId });
					saveErrors = {};
					open = false; // close, yes
				} catch (error) {
					if (isHttpError(error)) {
						if (error.body.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
							await unsubscribeLocally();
							// saveErrors = {};
						} else if (error.body.code === ErrorCodes.NotificationServer.BAD_REQUEST) {
							if (
								error.body.errors != null &&
								error.body.errors.type === "server-sent-validation-errors"
							) {
								saveErrors = error.body.errors.errors;
								const firstOptionKey = Object.keys(error.body.errors)[0];
								if (
									firstOptionKey != null &&
									firstOptionKey in configuration.data.serverConfig.config
								) {
									const optionEl = document.getElementById(`notconf-option-${firstOptionKey}`);
									if (optionEl != null) optionEl.scrollIntoView({ behavior: "smooth" });
								}
							}
						}
						toast.error("Couldn't save configuration", {
							id: toastId,
							description: error.body.message
						});
					} else {
						console.error(error);
						toast.error("Couldn't save configuration", {
							id: toastId,
							description: "Something went wrong"
						});
					}
				} finally {
					isSavingChanges = false;
				}
			}}
		>
			{#if isSavingChanges}
				<SpinnerIcon weight="bold" /> Saving changes
			{:else}
				<FloppyDiskBackIcon weight="fill" /> Save &AMP; close
			{/if}
		</Button>
	{/snippet}
</Dialog>
