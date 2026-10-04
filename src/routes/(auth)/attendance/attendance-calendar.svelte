<script lang="ts">
	import ArrowLeftIcon from "phosphor-svelte/lib/ArrowLeftIcon";
	import ArrowRightIcon from "phosphor-svelte/lib/ArrowRightIcon";
	import SpinnerIcon from "phosphor-svelte/lib/SpinnerIcon";

	import { pluralize } from "$lib";
	import { cn } from "$lib/cn-utils";
	import box from "$lib/components/box";
	import Button from "$lib/components/button.svelte";
	import Dialog from "$lib/components/dialog.svelte";
	import type { attendance } from "$lib/generated/models";
	import {
		CalendarDate,
		getDayOfWeek,
		today as getToday,
		GregorianCalendar
	} from "@internationalized/date";
	import { isHttpError } from "@sveltejs/kit";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { SvelteDate, SvelteMap } from "svelte/reactivity";
	import { cachedGracefulRemoteQuery } from "../states.svelte";
	import type { PageData } from "./$types";
	import * as remotes from "./attendance.remote";

	let { sessionUser }: Pick<PageData, "sessionUser"> = $props();

	const today = getToday("Asia/Kolkata");
	const selectedDate = new SvelteDate();
	const calendar = new GregorianCalendar();
	const calendarDate = $derived(
		new CalendarDate(
			calendar,
			selectedDate.getFullYear(),
			selectedDate.getMonth() + 1,
			selectedDate.getDate()
		)
	);
	const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const currentMonth = $derived.by(() => {
		const days = calendar.getDaysInMonth(calendarDate);
		const lastMonth = calendarDate.subtract({ months: 1 });
		const lastMonthLastDay = lastMonth.set({ day: calendar.getDaysInMonth(lastMonth) });
		const lastMonthLastWeekDay = getDayOfWeek(lastMonthLastDay, "en-US") + 1;
		return {
			days: days,
			prev: lastMonth,
			offset: {
				day: lastMonthLastDay.day,
				weekDay: lastMonthLastWeekDay
			},
			next: calendarDate.add({ months: 1 }),
			rest: 7 - ((lastMonthLastWeekDay + days) % 7)
		};
	});

	const monthlyAttendance = cachedGracefulRemoteQuery(
		{ name: `monthly-attendance`, version: 1 },
		remotes.getMonthlyAttendance
	);

	type DayDetails = {
		date: string;
		holiday: boolean;
		periods: attendance.AttendancePeriod[];
		totalPeriods: number | undefined;
	};

	const cached = new SvelteMap<string, Record<string, DayDetails>>();

	let selectedMonthKey = $derived(monthKey(calendarDate.year, calendarDate.month));
	let selectedMonthCache = $derived(cached.get(selectedMonthKey));
	let loadingMonthDir = $state<"prev" | "next">("prev");
	let prevLock = $state<string>();
	let nextLock = $state<string>(
		monthKey(today.add({ months: 1 }).year, today.add({ months: 1 }).month)
	);

	function monthKey(year: number, month: number) {
		return `${year}-${month}`;
	}

	async function fetchMonthlyAttendance(year: number, month: number) {
		const key = monthKey(year, month);

		if (cached.has(key)) return;

		await monthlyAttendance.load(sessionUser, { month: month, year: year });
		if (monthlyAttendance.data == null) {
			toast.error(
				isHttpError(monthlyAttendance.error)
					? monthlyAttendance.error.body.message
					: "Failed to load data for the month"
			);
		} else {
			cached.set(key, monthlyAttendance.data);
			if (Object.values(monthlyAttendance.data).every((day) => day.periods.length === 0)) {
				if (loadingMonthDir === "prev") prevLock = key;
				else nextLock = key;
			}
		}
	}

	onMount(async () => {
		await fetchMonthlyAttendance(calendarDate.year, calendarDate.month);
	});

	let showDayDetailsDialog = $state(false);
	let selectedDay = $state<DayDetails>();
</script>

<div class="space-y-4">
	<div class="flex place-items-center gap-2">
		<div class="grow font-serif text-3xl font-bold">
			{new Intl.DateTimeFormat("en-IN", {
				month: "long",
				year: "numeric"
			}).format(selectedDate)}
		</div>
		<Button
			size="icon-sm"
			variant="outline"
			disabled={monthlyAttendance.loading ||
				(prevLock != null &&
					monthKey(currentMonth.prev.year, currentMonth.prev.month) === prevLock)}
			onclick={async () => {
				loadingMonthDir = "prev";
				await fetchMonthlyAttendance(currentMonth.prev.year, currentMonth.prev.month);
				if (
					prevLock != null &&
					monthKey(currentMonth.prev.year, currentMonth.prev.month) === prevLock
				) {
					toast.info("Seems like you've reached the start!");
					return;
				}
				selectedDate.setMonth(selectedDate.getMonth() - 1);
			}}
		>
			{#if monthlyAttendance.loading && loadingMonthDir === "prev"}
				<SpinnerIcon weight="bold" class="animate-spin" />
			{:else}
				<ArrowLeftIcon weight="bold" />
			{/if}
		</Button>
		<Button
			size="icon-sm"
			variant="outline"
			disabled={monthlyAttendance.loading ||
				(nextLock != null &&
					monthKey(currentMonth.next.year, currentMonth.next.month) === nextLock)}
			onclick={async () => {
				loadingMonthDir = "next";
				await fetchMonthlyAttendance(currentMonth.next.year, currentMonth.next.month);
				if (
					nextLock != null &&
					monthKey(currentMonth.next.year, currentMonth.next.month) === nextLock
				) {
					toast.info("Seems like you've reached the end of it!");
					return;
				}
				selectedDate.setMonth(selectedDate.getMonth() + 1);
			}}
		>
			{#if monthlyAttendance.loading && loadingMonthDir === "next"}
				<SpinnerIcon weight="bold" class="animate-spin" />
			{:else}
				<ArrowRightIcon weight="bold" />
			{/if}
		</Button>
	</div>

	{#if selectedMonthCache == null}
		<box.Loading>Waiting for attendance data...</box.Loading>
	{:else}
		{@const stats = Object.values(selectedMonthCache).reduce(
			(p, c) => {
				p.total += c.periods.length;
				const missed = c.periods.filter((period) => period.attendance === "absent").length;
				p.missed += missed;
				if (!c.holiday && missed === c.periods.length) {
					// cut it all
					p.fullDayCut++;
				}
				return p;
			},
			{ total: 0, missed: 0, fullDayCut: 0 }
		)}
		<p class="text-sm">
			You missed {stats.missed}
			{pluralize(stats.missed, "period", "periods")} in {new Intl.DateTimeFormat("en-IN", {
				month: "long"
			}).format(selectedDate)}, out of total {stats.total}
			{pluralize(stats.total, "period", "periods")}.
			{#if stats.fullDayCut !== 0}
				<b class="text-error-foreground">
					Also, you cut {stats.fullDayCut} whole {pluralize(stats.fullDayCut, "day", "days")}!
				</b>
			{/if}
		</p>
	{/if}

	{#snippet daybit(year: number, month: number, day: number)}
		{@const dayKey = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`}
		{@const data =
			selectedMonthCache == null
				? null
				: dayKey in selectedMonthCache
					? selectedMonthCache[dayKey]
					: null}

		<Button
			variant="ghost"
			size="min"
			class="flex flex-col items-center gap-1 px-3 py-2 font-normal"
			disabled={calendarDate.year !== year || calendarDate.month !== month}
			onclick={() => {
				if (data == null) {
					toast.info("Nothing to see in here!");
					return;
				}
				selectedDay = data;
				showDayDetailsDialog = true;
			}}
		>
			<div
				class={cn(
					"text-center text-lg",
					year === today.year && month === today.month
						? day === today.day
							? "font-bold text-ret-accent"
							: "font-medium"
						: "",
					calendarDate.year === year && calendarDate.month === month ? "" : "text-muted-foreground",
					data?.holiday ? "text-ret-excellent-foreground" : ""
				)}
			>
				{day}
			</div>
			<div class="grid w-fit grid-cols-3 gap-0.5">
				{#if data == null}
					{#each { length: 6 }}
						<div class="aspect-square h-1.5 rounded-full"></div>
					{/each}
				{:else}
					{#each data.periods as period (`${dayKey}-${period.hour}`)}
						<div
							class={cn(
								"aspect-square h-1.5 rounded-full",
								period.attendance === "present" ? "bg-ret-accent" : "bg-ret-favourite"
							)}
						></div>
					{/each}
					{#each { length: Math.max(6 - data.periods.length, 0) }}
						<div class="aspect-square h-1.5 rounded-full"></div>
					{/each}
				{/if}
			</div>
		</Button>
	{/snippet}

	<div class="border-2 border-border shadow-block-shadow">
		<div class="grid grid-cols-7">
			{#each { length: 7 }, i}
				<div
					class="border-b-2 border-border px-2 py-1 text-center text-xs text-muted-foreground lowercase"
				>
					{WEEK_DAYS[i]}
				</div>
			{/each}

			{#each { length: ((currentMonth.offset.weekDay - 1) % 7) + 1 }, i}
				{@render daybit(
					currentMonth.prev.year,
					currentMonth.prev.month,
					currentMonth.offset.day - currentMonth.offset.weekDay + i + 1
				)}
				<!-- <div class="text-muted-foreground">
					{currentMonth.offset.day - currentMonth.offset.weekDay + i + 1}
				</div> -->
			{/each}

			{#each { length: currentMonth.days }, i}
				{@render daybit(calendarDate.year, calendarDate.month, i + 1)}
			{/each}

			{#each { length: Math.floor((currentMonth.offset.weekDay + currentMonth.days) / 7) < 5 ? 7 + currentMonth.rest : currentMonth.rest }, i}
				{@render daybit(currentMonth.next.year, currentMonth.next.year, i + 1)}
			{/each}
		</div>
	</div>

	<p class="text-sm text-muted-foreground">
		Click on day to see the periods recorded on that day, and topic coverages if specified.
		Additional stats too.
	</p>
</div>

<Dialog bind:open={showDayDetailsDialog}>
	{#snippet title()}
		{#if selectedDay == null}
			Hmm.
		{:else}
			{new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date(selectedDay.date))}
		{/if}
	{/snippet}

	{#snippet description()}
		{#if selectedDay == null}
			Damn.
		{:else}
			{@const stats = selectedDay.periods.reduce(
				(p, c) => {
					if (c.attendance === "present") p.attended++;
					else p.missed++;
					return p;
				},
				{ missed: 0, attended: 0 }
			)}
			{#if selectedDay.holiday}
				Marked as holiday.
			{:else}
				{#if selectedDay.totalPeriods != null}
					{selectedDay.periods.length}
					{pluralize(selectedDay.periods.length, "period", "periods")} recorded out of
					{selectedDay.totalPeriods}.
				{:else}
					{selectedDay.periods.length}
					{pluralize(selectedDay.periods.length, "period", "periods")} were recorded.
				{/if}

				{#if stats.attended === selectedDay.periods.length}
					<b class="text-success-foreground">You attended them all!</b>
				{:else if stats.missed === selectedDay.periods.length}
					<b class="text-error-foreground">You cut them all!</b>
				{:else}
					You <b class="text-error-foreground">cut {stats.missed}</b> of that {selectedDay.periods
						.length}.
				{/if}
			{/if}
		{/if}
	{/snippet}

	{#if selectedDay != null}
		{@const grouped = selectedDay.periods.reduce(
			(p, c) => {
				const last = p[p.length - 1];
				if (last.length === 0) {
					last.push(c);
				} else {
					const lastlast = last[last.length - 1];
					if (lastlast.hour == null) {
						p.push([c]);
					} else {
						if (
							lastlast.hour + 1 === c.hour &&
							lastlast.subject === c.subject &&
							lastlast.attendance === c.attendance &&
							((lastlast.topic_cov == null && lastlast.topic_cov == c.topic_cov) ||
								(lastlast.topic_cov.length === c.topic_cov.length &&
									lastlast.topic_cov.every((t, i) => t === c.topic_cov[i])))
						) {
							last.push(c);
						} else {
							p.push([c]);
						}
					}
				}

				return p;
			},
			[[]] as attendance.AttendancePeriod[][]
		)}

		<div class="space-y-2">
			{#each grouped as periods, i (i)}
				<div class="space-y-2">
					<div class="flex justify-center gap-0 font-serif text-2xl font-bold">
						{#each periods as period, j (j)}
							<span
								class={period.attendance === "absent"
									? "text-error-foreground"
									: "text-success-foreground"}
							>
								{period.hour}
							</span>
							{#if j < periods.length - 2}
								<span class="font-normal text-muted-foreground">,</span>&nbsp;
							{:else if j < periods.length - 1}
								&nbsp;<span class="font-normal text-muted-foreground">&</span>&nbsp;
							{/if}
						{/each}
					</div>
					<div class="border-2 border-border px-3 py-2">
						<div class="font-medium">{periods[0].subject}</div>
						{#if periods[0].topic_cov && Array.isArray(periods[0].topic_cov) && periods[0].topic_cov.length > 0}
							<ul class="mt-1 list-disc pl-4 text-sm text-muted-foreground">
								{#each periods[0].topic_cov as topic, k (k)}
									<li>{topic}</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			{/each}

			<!-- {#each selectedDay.periods as period (`${selectedDay.date}-${period.hour}`)}
				<div class="space-y-1 px-3 py-2">
					<div class="font-medium">{period.subject}</div>
					{#if period.topic_cov}
						<div class="text-sm text-muted-foreground">{period.topic_cov}</div>
					{/if}
				</div>
			{/each} -->
		</div>
	{/if}
</Dialog>
