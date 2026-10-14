<script lang="ts">
	import { defaultChartPadding, LineChart } from "layerchart";
	import { getAccountCreationDates } from "./admin.remote";
	import box from "$lib/components/box";
</script>

{#await getAccountCreationDates()}
	<box.Loading>Loading user data...</box.Loading>
{:then data}
	<div class="grid grid-flow-row sm:grid-cols-2">
		<div class="px-3 py-2">
			<div class="font-serif text-6xl font-bold">{data.length}</div>
			<div>total users</div>
		</div>
		<div class="px-3 py-2">
			<div class="font-serif text-6xl font-bold">
				{data.filter((s) => !!s.hasEnabledNotifications).length}
			</div>
			<div>users with notifications enabled</div>
		</div>
	</div>

	<div class="border-2 border-border shadow-block-shadow">
		<LineChart
			data={data
				.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
				.map((d, i) => ({ count: i + 1, ...d }))}
			x="createdAt"
			y="count"
			yNice
			padding={defaultChartPadding({ top: 30, right: 20, bottom: 40, left: 35 })}
			height={300}
		/>
	</div>

	<!-- <pre>{JSON.stringify(data, null, 2)}</pre> -->
{:catch}
	<box.Error>Failed to load data.</box.Error>
{/await}
