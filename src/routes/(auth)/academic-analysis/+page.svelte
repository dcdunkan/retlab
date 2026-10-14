<script lang="ts">
	import box from "$lib/components/box";
	import { isHttpError } from "@sveltejs/kit";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { cachedGracefulRemoteQuery, getClientSessionUser } from "../states.svelte";
	import AcademicAnalysisCharts from "./academic-analysis-charts.svelte";
	import * as remotes from "./academic-analysis.remote";
	import WebAccessGuardian from "./web-access-guardian.svelte";

	let isGuardianOpen = $state(false);

	const sessionUser = getClientSessionUser();

	const academicAnalysis = cachedGracefulRemoteQuery(
		{ name: "academicAnalysis-e", version: 1 },
		remotes.getAcademicAnalysis
	);

	async function loadAcademicAnalysis() {
		await academicAnalysis.load(sessionUser);

		if (academicAnalysis.data == null) {
			// todo: make this one better
			if (isHttpError(academicAnalysis.error)) {
				toast.error(academicAnalysis.error.body.message);
				if (academicAnalysis.error.body.code === "WebAccess:NO_ACTIVE_SESSION") {
					isGuardianOpen = true;
				}
			} else {
				console.log(academicAnalysis.error);
				toast.error("Something went wrong!");
			}
		}
	}

	onMount(async () => {
		await loadAcademicAnalysis();
	});
</script>

<svelte:head>
	<title>Academic Analysis / Retlab</title>
</svelte:head>

{#if !academicAnalysis.loading && academicAnalysis.data == null}
	<WebAccessGuardian
		open={isGuardianOpen}
		onClose={async () => {
			await loadAcademicAnalysis();
		}}
	/>
{/if}

<box.Warning>Work in progress!</box.Warning>

{#if academicAnalysis.loading}
	<box.Loading>Spawning web-access guardian...</box.Loading>
{:else if academicAnalysis.data != null}
	<AcademicAnalysisCharts academicAnalysis={academicAnalysis.data} />
{:else}
	<box.Error>
		{isHttpError(academicAnalysis.error)
			? academicAnalysis.error.body.message
			: "Something went wrong!"}
	</box.Error>
{/if}
