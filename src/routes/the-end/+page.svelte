<script>
	import { resolve } from "$app/paths";
	import Timestamp from "$lib/components/timestamp.svelte";
</script>

<svelte:head>
	<title>Thank you for using Ret :)</title>
</svelte:head>

<section>
	<!-- <h1>Retlab is down & may be forever.</h1> -->

	<h1>Thank you for using Ret!</h1>

	<blockquote>
		<h4>TL;DR</h4>

		<p>
			Etlab's new client, Ret is offline for now, and your credentials have been deleted. The full
			story is below.
		</p>
	</blockquote>

	<p>
		Hi, I'm Sheron (<a href="https://github.com/dcdunkan">@dcdunkan</a>) & Retlab was my passion
		project, an attempt at building a usable, convenient client for
		<a href="https://etlab.in">Etlab</a>. It had a small, but growing userbase. It was built out of
		pure frustration with the official web, Android & iOS client apps.
	</p>

	<p>
		But on October 11, 2026, Etlab released their newest client: <a
			href="https://students.etlab.app">Etlab Students</a
		>
		and it looks like they killed other clients except for web (at least at the time of writing, <Timestamp
			timestamp={new Date(2026, 9, 29)}
			raw
			dateTimeFormatter={new Intl.DateTimeFormat("en-IN", {
				dateStyle: "medium"
			})}
			class="text-base"
		/>).
	</p>

	<p>
		And Ret<span class="text-ret-accent">*</span> relied on the APIs used by those clients which got (seemingly)
		killed. Ret used many workarounds and cleanups to try to present the values in ways that made sense.
	</p>

	<p>
		I could technically change every API call that Ret makes, to work with the new Etlab Students
		app's Go API. But that's tedious work, at least right now, because they're constantly updating
		it. Would be stupid to depend work on such an ever changing application, with given how good the
		current AI-assisted development is.
	</p>

	<p>
		And in the new app, they got <a href={resolve("/docs/release-notes/[tag]", { tag: "2026.9.2" })}
			>the fun graphs and analytics</a
		>
		which Ret had, <a href={resolve("/docs/notifications")}>notifications</a> which was very hard to
		implement in Ret. So, the only plus points of Ret would be, seeing how many classes you can
		skip, and client-side PDF compression for assignments. I had
		<a href={resolve("/docs/roadmap")}>a lot of features planned</a>, but it's not worth rebuilding
		the existing stuff on a moving target right now.
	</p>

	<p>
		Anyway, for the time being, I'm pausing development of Ret. If the new Etlab API settles down, I
		might pick it back up, and I'll announce it on LinkedIn, and you can also watch <a
			href="https://github.com/dcdunkan/retlab">the GitHub repo</a
		>. Either way, everything stays open-source. I had so much fun while it lasted, because it was
		very challenging. Each problem (and non-problem) required its own solution, which taught me a
		lot! I learned push notifications, Svelte much better, redis, proxies, caching, IndexedDB,
		decompiling & basically reverse-engineering the Etlab Android app, PDF documents, PDF
		compression and a lot more. I had 141 users across Kerala (mostly in my own college, agreed, but
		still) with no official publicity done.
	</p>

	<p>
		And Ret & related works will always be open-source & <a href={resolve("/docs")}>documented</a>:
	</p>

	<ul>
		<li><a href="https://github.com/dcdunkan/retlab">retlab</a>, the app,</li>
		<li>
			<a href="https://github.com/dcdunkan/retlab-notifications">ret-nots</a>, the self-hostable
			official notification server,
		</li>
		<li>
			and the one that started it all:
			<a href="https://github.com/dcdunkan/retlab-generate">retlab-generate</a>.
		</li>
	</ul>

	<p>
		<b>So, Ret will be offline for now.</b> I've already deleted all sessions and stored Etlab
		credentials, and I'll wipe the rest of the data on December 31, 2026. If you'd like it gone
		sooner, e-mail me at
		<b>dcdunkan[at]gmail[com]</b>.
	</p>

	<p>
		Thank you for trying Ret, for the bug reports, and for telling your friends. Building something
		people actually used was the best part of this. Take care, and see you if I'm back.
	</p>
</section>

<address class="left">Dunks</address>
