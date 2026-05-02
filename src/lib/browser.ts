export async function unsubscribeLocally() {
	const workerRegistration = await navigator.serviceWorker.getRegistration();
	if (workerRegistration == null) return;
	const localSubscription = await workerRegistration.pushManager.getSubscription();
	if (localSubscription != null) {
		if (await localSubscription.unsubscribe()) return;
		else throw new Error("something went wrong while unsubscribing");
	}
}

export async function getLocalSubscription() {
	const workerRegistration = await navigator.serviceWorker.getRegistration();
	if (workerRegistration == null) return null;
	return await workerRegistration.pushManager.getSubscription();
}
