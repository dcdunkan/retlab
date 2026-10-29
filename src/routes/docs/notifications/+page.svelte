<script>
	import Timestamp from "$lib/components/timestamp.svelte";

	const yearAndMonth = new Intl.DateTimeFormat("en-IN", {
		year: "numeric",
		month: "long"
	});
</script>

<section>
	<p>
		Notifications have been broken in Etlab instances (at least in our <a
			target="_blank"
			href="https://tkmce.etlab.in">TKM College of Engineering instance</a
		>
		and a few other I asked about) for a very long time now. They used to work till <Timestamp
			timestamp={new Date(2024, 11, 31)}
			dateTimeFormatter={yearAndMonth}
			class="text-base"
		/> if I remember correctly. Even then it was unreliable, buggy, and it broke frequently. If you don't
		know already, it's Etlab's backend server which has to dispatch the notifications to users, through
		some Push notification service. They seem to have been using FCM (Firebase Cloud Messaging). And that
		seem to be broken? Something with their configuration?
	</p>

	<p>
		So in Ret, I wanted to get notifications for important events, such as missed attenandace,
		published assignments, published results, etc. But, since we do not have access to the backend
		of Etlab, we need to solve two problems to get notifications in Ret:
	</p>

	<ol>
		<li>
			<b>Figuring out the contents of the notifications to show</b> (how to obtain the data without Etlab's
			server dispatching it?)
		</li>
		<li><b>How to show the notifications to the user?</b></li>
	</ol>

	<p>
		To solve the first problem, <b>we need the data</b>. Ideally, when the teacher marks the
		attendance, Etlab's server should dispatch the notifications saying "you missed a period" or
		"you attended a period". But, as said, we can't do that because we are not
		<a target="_blank" href="https://etuwa.in/">Etuwa</a>. So, the only option that I can think of
		is to, periodically fetch the data and compare it with previously fetched data, and if there are
		any differences, show them as notifications. Easy.
	</p>

	<p>
		The second is an actual problem. Ret is a website, so you can only send notifications using the <a
			target="_blank"
			href="https://developer.mozilla.org/en-US/docs/Web/API/Push_API">Push API</a
		>, which needs a service worker. Making a service worker and dispatching notifications from it
		are easy tasks; but, how should the service worker get the data (which was the first problem) to
		compare and show as notifications? There are two ways:
	</p>

	<ol>
		<li>
			Service worker periodically polls using
			<a
				target="_blank"
				href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Synchronization_API"
				>background periodic sync</a
			> for new data, compares against the old data. All happen on your device & drains your battery.
		</li>
		<li>
			A 3rd party server which periodically polls for new data, compares against the old data and
			sends it your devices using the Push API.
		</li>
	</ol>

	<p>
		So, considering the battery draining issue, the preferred way is to use a server. But, that's
		expensive! A server dedicated to fetch data periodically and send to all users? Pfft. Naturally,
		I tried the first option, because that's not expensive, and only the people who wants the
		notifications has to enable it. But, turns out...
	</p>

	<ul>
		<li>
			Periodic background sync has limited availability: only in Chrome & Edge (76.61 % of the
			market as of <Timestamp
				class="text-base"
				timestamp={new Date(2026, 9, 19)}
				dateTimeFormatter={yearAndMonth}
				raw
			/>).
		</li>
		<li>
			Even in Chromium-based browsers, the minimum frequency for the sync is <b>12 hours</b> because
			it relies on site engagement score.
			<a target="_blank" href="https://felixgerschau.com/periodic-background-sync-explained/"
				>Read more about it here</a
			>
			and
			<a
				target="_blank"
				href="https://github.com/WICG/background-sync/issues/169#issuecomment-563942794">here</a
			>. That too with the highest score.
		</li>
		<li>
			Not at all guaranteed to run even with the highest score, because it depends on the device's
			network, device's battery and many other varying factors.
		</li>
	</ul>

	<p>
		I found about all of this after implementing it (very poor research on my side). But I did my
		research, and <b
			>settled on the second option: a separate server for periodically fetching and sending
			notifications</b
		>.
	</p>

	<p>
		So, <b
			>I built <a target="_blank" href="https://github.com/dcdunkan/retlab-notifications"
				>retlab-notifications</a
			> (ret-nots), the official notification server (NS) for Ret</b
		>. It's a self-hostable Deno (<a target="_blank" href="https://deno.com/blog/cloudflare"
			>RIP Deno!</a
		>) application, which utilizes the built-in Deno Cron to periodically do the fetch & send and
		Deno KV to store user data & cache. It follows a protocol to communicate with Ret. So basically,
		anyone can create a notification server which follows the same protocol and implement any kind
		of notifications, and it would just work.
	</p>

	<p>
		<b>ret-nots</b> is built to be self-hostable on Deno Deploy free tier, and work for up to 50 users
		& 4 devices each. It polls every 5 minutes the following notification channels:
	</p>

	<ol>
		<li>New attendance marked (only reports missed classes by default)</li>
		<li>Series exam results (published or modified)</li>
		<li>New surveys posted (teacher evaluation, course exit & general)</li>
		<li class="text-muted-foreground">Help me add more here?</li>
	</ol>

	<p>
		<q><i>Why not integrate the notification server functionalities in Ret itself?</i></q>
		Because, that's still expensive considering I currently host Ret on Vercel's free tier, which has
		limited cron job executions:
		<a target="_blank" href="https://vercel.com/docs/cron-jobs/usage-and-pricing"
			>only once per day</a
		>. So yeah.
	</p>
</section>
