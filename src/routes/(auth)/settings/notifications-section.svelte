<script lang="ts">
	import BellRingingIcon from "phosphor-svelte/lib/BellRingingIcon";
	import CheckIcon from "phosphor-svelte/lib/CheckIcon";
	import FirstAidKitIcon from "phosphor-svelte/lib/FirstAidKitIcon";
	import GearFineIcon from "phosphor-svelte/lib/GearFineIcon";
	import NotificationIcon from "phosphor-svelte/lib/NotificationIcon";
	import SignOutIcon from "phosphor-svelte/lib/SignOutIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";
	import WarningIcon from "phosphor-svelte/lib/WarningIcon";
	import XIcon from "phosphor-svelte/lib/XIcon";

	import { page } from "$app/state";
	import { unsubscribeLocally } from "$lib/browser";
	import box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import Switch from "$lib/components/switch.svelte";
	import { ErrorCodes } from "$lib/errors";
	import { type ClientNotificationServerSettingsState } from "$lib/server/schema";
	import { LoadState, type LoadData } from "$lib/types";
	import { isHttpError } from "@sveltejs/kit";
	import { toast } from "svelte-sonner";
	import { notificationServerSettingsState } from "../states.svelte";
	import ConfigureNotificationsDialog from "./configure-notifications-dialog.svelte";
	import {
		checkNotificationServerHealth,
		getNotificationServerVapidKey,
		hasSubscribedToNSWithEndpoint,
		registerNotificationServer,
		subscribeToNotificationServer,
		unregisterFromNotificationServer,
		unsubscribeFromNotificationServer
	} from "./notifications.remote";
	import { notificationServerSchema } from "./settings-schema";

	type NotificationSubscriptionState = "checking" | "unregistered" | "disabled" | "enabled";
	interface NotificationChecksStatus {
		// pwa: "in-use" | "not in-use";
		serviceWorker: "unsupported" | "installed" | "active" | "inactive";
		push: "unsupported" | "unsubscribed" | "denied" | "subscribed";
		notifications: "unsupported" | "should prompt" | "granted" | "denied";
	}

	// Loading states
	let isRequestingNotificationPermission = $state(false);
	let isRegisteringInServer = $state(false);
	let isUnregisteringFromServer = $state(false);
	let isCheckingNotificationServerHealth = $state(false);
	let isEnablingNotifications = $state(false);

	// Interaction effects
	let shouldAllowForcedUnregistration = $state(false);
	let showServerUrl = $state(false);
	let openConfigurationDialog = $state(false);

	// States
	let checks = $state<LoadData<NotificationChecksStatus>>({
		state: LoadState.Pending,
		message: "Running device compatibility checks..."
	});
	const canEnableNotifications = $derived.by(() => {
		if (checks.state === LoadState.Resolved) {
			return (
				// checks.data.pwa === "in-use" &&
				checks.data.serviceWorker === "active" &&
				(checks.data.push === "subscribed" || checks.data.push === "unsubscribed") &&
				checks.data.notifications === "granted"
			);
		}
		return false;
	});
	let notificationsSubscriptionState = $state<NotificationSubscriptionState>("checking");
	let notificationSwitchEnabled = $derived(notificationsSubscriptionState === "enabled");

	$effect(() => {
		runNotificationChecks();
	});

	$effect(() => {
		notificationsSubscriptionState = "checking";
		if (!notificationServerSettingsState.resolved) return;
		if (checks.state !== LoadState.Resolved) return;

		const { notificationServerSettings } = {
			notificationServerSettings: notificationServerSettingsState.value
		};
		updateNotificationsSubscriptionState(notificationServerSettings);
	});

	async function updateNotificationsSubscriptionState(
		notificationServerSettings: ClientNotificationServerSettingsState
	) {
		notificationsSubscriptionState = "checking";

		// not registered in a notification server, so unsubscribe local subscription if any.
		if (notificationServerSettings == null) {
			await unsubscribeLocally();
			notificationsSubscriptionState = "unregistered";
			return;
		}
		// notification server is configured. need to check whether its subscribed locally
		const workerRegistration = await navigator.serviceWorker.getRegistration();
		if (workerRegistration?.active?.state !== "activated") {
			notificationsSubscriptionState = "disabled";
			return;
		}
		const subscription = await workerRegistration.pushManager.getSubscription();
		if (subscription == null) {
			notificationsSubscriptionState = "disabled";
			return;
		}
		// it is subscribed locally. is it connected remotely?
		let hasRemoteSubscription: boolean;
		try {
			hasRemoteSubscription = await hasSubscribedToNSWithEndpoint({
				endpoint: subscription.endpoint
			});
		} catch (err) {
			if (isHttpError(err)) {
				if (err.body.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
					await unsubscribeLocally();
					notificationsSubscriptionState = "unregistered";
					return;
				} else {
					toast.error(err.body.message);
				}
			}
			return;
		}
		if (hasRemoteSubscription) {
			notificationsSubscriptionState = "enabled";
			return;
		}

		// no remote subscription. lets unsubscibe local sub if any and disable state.
		await unsubscribeLocally();
		notificationsSubscriptionState = "disabled";
		return;
	}

	async function runNotificationChecks() {
		checks = {
			state: LoadState.Pending,
			message: "Running device compatibility checks..."
		};
		try {
			checks = {
				state: LoadState.Resolved,
				data: await getChecksDetails()
			};
		} catch (error) {
			console.error(error);
			checks = {
				state: LoadState.Rejected,
				message: "Something went wrong!"
			};
		}
	}

	async function getChecksDetails(): Promise<NotificationChecksStatus> {
		const status: NotificationChecksStatus = {
			// pwa: "not in-use",
			serviceWorker: "unsupported",
			push: "unsupported",
			notifications: "unsupported"
		};

		// if (
		// 	window.matchMedia("(display-mode: standalone)").matches ||
		// 	// @ts-expect-error window.navigator.standalone is like safari only or somthhng
		// 	window.navigator.standalone === true
		// ) {
		// 	status.pwa = "in-use";
		// }

		const NOTIFICATION_SERVICE_WORKER = "/service-worker.js";
		const serviceWorkerUrl = new URL(NOTIFICATION_SERVICE_WORKER, page.url).href;
		if ("serviceWorker" in navigator) {
			status.serviceWorker = "inactive";
		}

		try {
			const query = await navigator.permissions.query({
				name: "push",
				// @ts-expect-error wtf
				userVisibleOnly: true
			});
			status.push = query.state === "granted" ? "unsubscribed" : "denied";
		} catch (error) {
			if (error instanceof TypeError) {
				status.push = "unsupported";
			} else {
				throw error;
			}
		}

		if (status.serviceWorker !== "unsupported") {
			const serviceWorkerRegistrations = await navigator.serviceWorker.getRegistrations();

			let worker: ServiceWorkerRegistration | null = null;
			for (const registration of serviceWorkerRegistrations) {
				if (registration.active == null) continue;
				if (registration.active.scriptURL !== serviceWorkerUrl) continue;
				status.serviceWorker = registration.active.state === "activated" ? "active" : "installed";
				worker = registration;
				break;
			}

			// double checking the periodic sync ability.
			if (worker != null && status.push !== "unsupported" && "pushManager" in worker) {
				const pushSubscription = await worker.pushManager.getSubscription();
				status.push = pushSubscription == null ? "unsubscribed" : "subscribed";
			}
		}

		if ("Notification" in window) status.notifications = "denied";
		if (status.notifications !== "unsupported") {
			const query = await navigator.permissions.query({ name: "notifications" });
			status.notifications =
				query.state === "granted"
					? "granted"
					: query.state === "denied"
						? "denied"
						: "should prompt";
		}

		return status;
	}

	async function requestNotificationPermission() {
		isRequestingNotificationPermission = true;
		if ("Notification" in window) {
			if (Notification.permission === "granted") {
				toast.error("Already granted!", {
					description: "Hmmm... try reloading the page."
				});
			} else {
				const toastId = toast.loading("Requesting...", {
					duration: Infinity,
					dismissible: false
				});
				try {
					const permission = await Notification.requestPermission();
					if (permission === "granted") {
						toast.success("Good!", {
							description: "You can now use notifications"
						});
						new Notification("Can you see this?", {
							body: "Just making sure I can actually send a notification",
							silent: false,
							icon: "/favicon-96x96.png"
						});
					} else if (permission === "denied") {
						toast.error("Denied!!", {
							description:
								"That's alright, if you want to enable again, follow the mentioned steps."
						});
					} else {
						toast.info("Denied?");
					}
				} catch (error) {
					console.error(error);
					toast.error("Something went wrong", {
						description: "No idea what happened."
					});
				} finally {
					toast.dismiss(toastId);
				}
			}
		} else {
			toast.error("Unsupported!", {
				description: "Notifications are unsupported by your browser."
			});
		}
		isRequestingNotificationPermission = false;
		await runNotificationChecks();
	}
</script>

<section>
	<h2 class="sticky top-10 z-49 -mx-4 bg-background/75 px-4 py-2 text-2xl italic">Notifications</h2>

	{#if checks.state === LoadState.Pending}
		<box.Loading>{checks.message}</box.Loading>
	{:else if checks.state === LoadState.Resolved}
		<div class="space-y-2">
			<p class="text-sm">
				<b class="text-amber-800">
					This feature will only be active until Etlab make their notifications work again.
				</b>
				Implementing reliable notifications are tricky. Retlab don't have access to the backend of Etlab,
				so its impossible to get notifications triggered from there. So we use notification servers.
				<span class="text-muted-foreground">(more info regarding this will be available soon)</span>
			</p>
		</div>

		<div class="mt-4 divide-y-2 border-2 bg-gray-100">
			<div class="flex justify-between gap-4 px-4 py-4">
				<div class="space-y-2">
					<div class="font-bold">Setup checklist</div>

					<div class="space-y-2 text-sm">
						<!-- <div class="flex place-items-start gap-2">
							{#if checks.data.pwa === "in-use"}
								<CheckIcon weight="bold" class="shrink-0 text-green-600" />
							{:else}
								<XIcon weight="bold" class="shrink-0 text-red-700" />
							{/if}

							<div class="space-y-1">
								<div>
									Using the PWA (<span class="font-bold">{checks.data.pwa}</span>)
								</div>

								{#if checks.data.pwa !== "in-use"}
									<p class="text-xs">
										You must install &amp; use the app as PWA in order to have the periodic
										background sync work and get notifications.
									</p>
								{/if}
							</div>
						</div> -->

						<div class="flex place-items-start gap-2">
							{#if checks.data.serviceWorker === "active"}
								<CheckIcon weight="bold" class="shrink-0 text-green-600" />
							{:else if checks.data.serviceWorker === "unsupported"}
								<WarningIcon weight="bold" class="shrink-0 text-amber-500" />
							{:else}
								<XIcon weight="bold" class="shrink-0 text-red-700" />
							{/if}

							<div class="space-y-1">
								<div>
									Service worker (<span class="font-bold">{checks.data.serviceWorker}</span>)
								</div>
								{#if checks.data.serviceWorker !== "active"}
									<p class="text-xs">
										Your browser must support service worker so they can do stuff like background
										actions.
									</p>
								{/if}
							</div>
						</div>

						<div class="flex place-items-start gap-2">
							{#if checks.data.push === "subscribed" || checks.data.push === "unsubscribed"}
								<CheckIcon weight="bold" class="shrink-0 text-green-600" />
							{:else if checks.data.push === "unsupported"}
								<WarningIcon weight="bold" class="shrink-0 text-amber-500" />
							{:else}
								<XIcon weight="bold" class="shrink-0 text-red-700" />
							{/if}

							<div class="space-y-1">
								<div>
									Push permission (<span class="font-bold">{checks.data.push}</span>)
								</div>

								{#if checks.data.push !== "subscribed" && checks.data.push !== "unsubscribed"}
									<p class="text-xs">
										The notification server must push notifications from there to reach you here.
										So, your browser should support this and you should grant the permission to do
										so.
									</p>
								{/if}
							</div>
						</div>

						<div class="flex place-items-start gap-2">
							{#if checks.data.notifications === "granted"}
								<CheckIcon weight="bold" class="shrink-0 text-green-600" />
							{:else if checks.data.notifications === "unsupported"}
								<WarningIcon weight="bold" class="shrink-0 text-amber-500" />
							{:else if checks.data.notifications === "should prompt"}
								<BellRingingIcon weight="bold" class="shrink-0" />
							{:else}
								<XIcon weight="bold" class="shrink-0 text-red-700" />
							{/if}

							<div class="space-y-1">
								<div>
									Notifications permission (<span class="font-bold"
										>{checks.data.notifications}</span
									>)
								</div>
								{#if checks.data.notifications !== "granted"}
									<p class="text-xs">
										You should grant notification permissions so that it can show you the
										notifications.
									</p>
								{/if}
								{#if checks.data.notifications === "denied"}
									<p class="text-xs font-bold text-blue-500">
										You either have previously denied the permission or it was denied by default so
										the request cannot be triggered. Here is how you can allow the permission: If on
										Android, open app info and allow notification permission. Idk about iOS.
									</p>
								{:else if checks.data.notifications === "should prompt"}
									<Button
										disabled={isRequestingNotificationPermission}
										class="mt-2"
										variant="outline"
										size="sm"
										shadow="none"
										onclick={async () => await requestNotificationPermission()}
									>
										{#if isRequestingNotificationPermission}
											<NotificationIcon /> Requesting...
										{:else}
											<BellRingingIcon weight="bold" /> Grant notification permission
										{/if}
									</Button>
								{/if}
							</div>
						</div>

						<p class="text-sm font-medium">
							If at least one of these shows up as not checked, then it means you can't enable
							notifications or if already enabled, you won't recieve them reliably.
						</p>
					</div>
				</div>
			</div>
		</div>

		{#if notificationServerSettingsState.resolved}
			<div class="mt-4 divide-y-2 border-2">
				<div class="flex justify-between gap-4 px-4 py-3">
					<div class="w-full space-y-2">
						<div>
							<div class="font-bold">Notification server</div>
							<!-- <p class="text-sm font-medium text-blue-600"></p> -->
						</div>

						{#if notificationServerSettingsState.value == null}
							<p class="text-sm">
								You must configure a notification server if you want to enable notifications. Sadly,
								I cannot provide one for everyone because it would be expensive. You can either
								self-host one or use one hosted by some trusted one.
							</p>

							<form
								{...registerNotificationServer
									.preflight(notificationServerSchema)
									.enhance(async ({ submit, data, form }) => {
										isRegisteringInServer = true;
										const toastId = toast.loading("Registering in server...");
										try {
											await submit();
											toast.dismiss(toastId);
											notificationServerSettingsState.set({
												url: data.serverUrl,
												vapidKey: "" // should work?
											});
											await updateNotificationsSubscriptionState(
												notificationServerSettingsState.value
											);
											form.reset();
										} catch (error) {
											if (isHttpError(error)) {
												console.error(error);
												toast.error("Registration failed", {
													description: error.body.message,
													id: toastId
												});
											} else {
												console.error(error);
												toast.error("Something went wrong", { id: toastId });
											}
										} finally {
											isRegisteringInServer = false;
										}
									})}
								class="space-y-2"
								oninput={() => registerNotificationServer.validate({ includeUntouched: true })}
							>
								<input
									{...registerNotificationServer.fields.serverUrl.as("url")}
									class="w-full text-sm"
									placeholder="Server URL"
									aria-invalid={registerNotificationServer.fields.serverUrl.issues() != null}
								/>

								{#each registerNotificationServer.fields.serverUrl.issues() as issue, i (i)}
									<p class="text-sm text-red-600">{issue.message}</p>
								{/each}

								<input
									{...registerNotificationServer.fields.accountPassword.as("password")}
									class="w-full text-sm"
									autocomplete="current-password"
									placeholder="Etlab account password"
									aria-invalid={registerNotificationServer.fields.accountPassword.issues() != null}
								/>

								{#each registerNotificationServer.fields.accountPassword.issues() as issue, i (i)}
									<p class="text-sm text-red-600">{issue.message}</p>
								{/each}

								<Button type="submit" disabled={isRegisteringInServer}>
									{#if isRegisteringInServer}
										<SpinnerIcon class="animate-spin" weight="bold" /> Generating...
									{:else}
										<CheckIcon weight="bold" /> Generate token & register
									{/if}
								</Button>

								{#each registerNotificationServer.fields.issues() as issue, i (i)}
									<p class="text-sm text-red-600">{issue.message}</p>
								{/each}
							</form>
						{:else}
							<p class="text-sm">
								You are currently registered in the notification server:
								<button onclick={() => (showServerUrl = !showServerUrl)}>
									{#if showServerUrl}
										<b>{notificationServerSettingsState.value.url}</b>
										<span class="text-muted-foreground">(click to keep it secret)</span>
									{:else}
										{@const url = new URL(notificationServerSettingsState.value.url)}
										{@const tld = url.hostname.slice(url.hostname.lastIndexOf(".") + 1)}
										<b>
											{url.protocol}//{url.hostname.slice(0, 3)}&mldr;{tld}{url.port
												? `:${"?".repeat(url.port.length)}`
												: ""}{url.pathname === "/" ? "" : url.pathname}
										</b> <span class="text-muted-foreground">(click to reveal)</span>
									{/if}
								</button>
							</p>

							{#if shouldAllowForcedUnregistration}
								<p class="text-sm text-red-600">
									<b>
										If you click unregister, you would be registering forcefully, which removes your
										subscription even if it fails to let the server know.
									</b>
								</p>
							{/if}

							<Button
								variant="outline"
								disabled={isUnregisteringFromServer || isCheckingNotificationServerHealth}
								onclick={async () => {
									isCheckingNotificationServerHealth = true;
									try {
										await checkNotificationServerHealth();
										toast.success("All good!");
									} catch (error) {
										if (isHttpError(error)) {
											toast.error("Something wrong!", {
												description: error.body.message
											});
										} else {
											console.error(error);
											toast.error("Something went wrong");
										}
									} finally {
										isCheckingNotificationServerHealth = false;
									}
								}}
							>
								{#if isCheckingNotificationServerHealth}
									<SpinnerIcon class="animate-spin" weight="bold" /> Querying...
								{:else}
									<FirstAidKitIcon weight="bold" /> Check health
								{/if}
							</Button>
							<Button
								variant="destructive"
								disabled={isUnregisteringFromServer || isCheckingNotificationServerHealth}
								onclick={async () => {
									isUnregisteringFromServer = true;
									const toastId = toast.loading("Cutting ties from notification server...");
									try {
										await unregisterFromNotificationServer({
											force: shouldAllowForcedUnregistration
										});
										await unsubscribeLocally();
										toast.success("Untied!", { id: toastId });
										notificationServerSettingsState.set(null);
										notificationsSubscriptionState = "unregistered";
									} catch (error) {
										if (isHttpError(error)) {
											if (error.body.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
												notificationServerSettingsState.set(null);
												toast.error("How do I cut it if there's not one?");
												await unsubscribeLocally();
												return;
											}
											if (error.body.code === ErrorCodes.Network.UNREACHABLE_SERVER) {
												shouldAllowForcedUnregistration = true;
												toast.error("Couldn't reach the server", {
													description: "Try forcing if you are very sure",
													id: toastId
												});
												return;
											}
											toast.error("Couldn't unregister", {
												description: error.body.message,
												id: toastId
											});
										} else {
											console.error(error);
											toast.error("Something went wrong", { id: toastId });
										}
									} finally {
										isUnregisteringFromServer = false;
									}
								}}
							>
								{#if isUnregisteringFromServer}
									<SpinnerIcon class="animate-spin" weight="bold" />
									{#if shouldAllowForcedUnregistration}
										Unregistering forcefully...
									{:else}
										Unregistering...
									{/if}
								{:else}
									<SignOutIcon weight="bold" />
									{#if shouldAllowForcedUnregistration}
										Force unregister
									{:else}
										Unregister
									{/if}
								{/if}
							</Button>
						{/if}
					</div>
				</div>

				<div class="flex justify-between gap-4 px-4 py-3">
					<div class="space-y-2">
						<div class="font-bold">
							Enable notifications
							<span class="text-muted-foreground">({notificationsSubscriptionState})</span>
						</div>
						<!-- <p class="text-sm font-medium text-blue-600"></p> -->

						<p class="text-sm">
							By enabling, you can connect the current device to the configured notification server
							by sharing your local subscription.
						</p>
					</div>

					<Switch
						bind:checked={notificationSwitchEnabled}
						disabled={!canEnableNotifications ||
							!notificationServerSettingsState.resolved ||
							isEnablingNotifications ||
							notificationServerSettingsState.value == null ||
							notificationsSubscriptionState === "checking" ||
							notificationsSubscriptionState === "unregistered"}
						onCheckedChange={async (checked) => {
							const notifChecks = await getChecksDetails();
							if (
								notificationServerSettingsState.value == null ||
								// covered by `canEnableNotifications`, but still.
								notifChecks.serviceWorker !== "active" ||
								(checked
									? notifChecks.push !== "unsubscribed"
									: notifChecks.push !== "subscribed") ||
								notifChecks.notifications !== "granted"
							) {
								toast.error("Not everything looks OK?", {
									description: "Make sure everything is checked in setup checklist."
								});
								return;
							}
							const worker = await navigator.serviceWorker.ready;

							if (checked) {
								isEnablingNotifications = true;
								const toastId = toast.loading("Subscribing to notification server...");
								try {
									const vapidKey = await getNotificationServerVapidKey();
									notificationServerSettingsState.set({
										url: notificationServerSettingsState.value.url,
										vapidKey: vapidKey
									});

									const subscriptionOptions: PushSubscriptionOptionsInit = {
										userVisibleOnly: true,
										applicationServerKey: vapidKey
									};

									const pushManagerPermissionState =
										await worker.pushManager.permissionState(subscriptionOptions);

									if (pushManagerPermissionState !== "granted") {
										toast.error("Failed to subscribe!", {
											description:
												"Seems like the permission for push manager has not been granted",
											id: toastId
										});
									} else {
										const subscription = await worker.pushManager.subscribe(subscriptionOptions);

										if (subscription == null) {
											toast.error("Looks like your browser couldn't provide a subscription", {
												description: "Maybe you could try again later?",
												id: toastId
											});
											return;
										}

										try {
											await subscribeToNotificationServer({
												endpoint: subscription.endpoint,
												keys: subscription.toJSON().keys,
												expirationTime: subscription.expirationTime
											});
											notificationsSubscriptionState = "enabled";
											notificationSwitchEnabled = true;
											toast.success("Success!", {
												id: toastId,
												description: "*Hopefully*, you will recieve notifications from now on."
											});
										} catch (error) {
											await subscription.unsubscribe();
											throw error;
										}
									}
								} catch (error) {
									let errorToastTitle = "Hmm. Something unexpected came up!";
									let errorToastDescription = "And literally no idea what that was.";
									if (isHttpError(error)) {
										if (error.body.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
											errorToastDescription = "Seems like the registration is gone!";
											notificationServerSettingsState.set(null);
										}
										errorToastDescription = error.body.message;
									} else if (error instanceof DOMException) {
										if (error.name === "InvalidAccessError") {
											console.error(error.message);
											errorToastDescription = "Invalid notification server key";
										} else {
											console.error(error);
											errorToastDescription = "Literally no idea what went wrong.";
										}
									} else {
										console.error(error);
										errorToastTitle = "Something went wrong";
									}
									notificationSwitchEnabled = false;

									toast.error(errorToastTitle, {
										id: toastId,
										description: errorToastDescription
									});
								} finally {
									isEnablingNotifications = false;
								}
							} else {
								isEnablingNotifications = true;

								const subscription = await worker.pushManager.getSubscription();
								if (subscription != null) {
									try {
										await unsubscribeFromNotificationServer({ endpoint: subscription.endpoint });
										await subscription.unsubscribe();
									} catch (error) {
										if (isHttpError(error)) {
											if (error.body.code === ErrorCodes.NotificationServer.UNAUTHORIZED) {
												notificationServerSettingsState.set(null);
												await unsubscribeLocally();
												toast.error("You are actually unauthorized btw, but unsubscribed locally");
											} else {
												toast.warning("Failed to unsubscribe from server", {
													description: error.body.message
												});
											}
										} else {
											toast.error("Couldn't unsubscribe properly!");
											await subscription.unsubscribe();
										}
									}
								}
								notificationSwitchEnabled = false;
								notificationsSubscriptionState = "disabled";
								isEnablingNotifications = false;
							}
						}}
					/>
				</div>
			</div>

			<Button
				variant="default"
				disabled={notificationsSubscriptionState !== "enabled"}
				class="mt-2 w-full"
				onclick={() => (openConfigurationDialog = true)}
			>
				<GearFineIcon weight="bold" /> Configure notifications
			</Button>

			{#if notificationsSubscriptionState === "enabled"}
				<ConfigureNotificationsDialog bind:open={openConfigurationDialog} />
			{/if}
		{:else}
			<box.Loading>Reading notification server settings</box.Loading>
		{/if}
	{:else}
		<box.Error>{checks.message}</box.Error>
	{/if}
</section>
