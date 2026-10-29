<script lang="ts">
	import SpeakerHighIcon from "phosphor-svelte/lib/SpeakerHighIcon";

	import ipaRet_mp3 from "$lib/assets/ipa-ret.mp3";
	import ipaRetlab_mp3 from "$lib/assets/ipa-retlab.mp3";
	import Button from "$lib/components/button.svelte";
	import { useSound } from "svelte-attach-sound";

	const ipaRet = useSound(ipaRet_mp3, ["click"]);
	const ipaRetlab = useSound(ipaRetlab_mp3, ["click"]);
</script>

<section>
	<h2>What's Retlab?</h2>

	<p>
		<b>
			Retlab is an opinionated, slightly convenient client for
			<a target="_blank" href="https://etlab.in">Etlab</a>.
		</b>
	</p>
	<p>
		It is an <a target="_blank" href="https://github.com/dcdunkan/retlab">open-source</a>,
		unofficial, alternative 3rd party client built out of pure frustation with the official Android
		& iOS client applications.
	</p>

	<p>
		Etlab has to be one of the most feature-rich complex applications ever built, just to be
		presented in the worst form possible, stitched & glued together somehow. And while their backend
		and website (the presentation is bad though) work well enough, their official <a
			target="_blank"
			href="https://play.google.com/store/apps/details?id=in.etuwa.app&pcampaignid=web_share"
			>Android</a
		>
		& <a target="_blank" href="https://apps.apple.com/in/app/etlab/id1350062745">iOS</a>
		applications are among the worst applications I have ever used.
		<b
			>They are slow, filled with bugs, incomplete and not at all fun to use, for an application
			that is widely used almost everyday.</b
		>
		So, Retlab is my attempt at making a client (not native) that is a bit more comfortable to use.
	</p>

	<p>
		If you find Retlab to be any of those things that I complain about Etlab, or if you want any new
		features or bug fixes, feel free to let me know by <a
			target="_blank"
			href="https://github.com/dcdunkan/retlab/issues/new">creating a GitHub issue</a
		>.
	</p>

	<p>Thank you so much for using Ret! I hope you find it useful.</p>
</section>

<section>
	<h2>Why Exactly?</h2>

	<p>
		It all started when we had to fill our log books with our results after each semester (I only
		did it after 5th semester iirc). And, we all had to switch between the web app & the native app
		frequently because both of them had mutually exclusive missing values. So, I had to figure out
		"why". Why isn't the app showing all the information? Does it have the information? Is it just
		not showing? I was concerned about the APIs used in the app, because I knew the web apps are
		fully server-side rendered (SSR); so, no APIs to investigate there.
	</p>

	<p>
		Enter <a target="_blank" href="https://github.com/skylot/jadx">JADX</a>, which I used to
		decompile the Android application to Java code. But I never got to finding out why the results
		are incomplete, because, when I found out all the APIs, I was intrigued to make a better client.
		So, I wrote some scripts to parse the code & extract useful data such as the
		<a
			target="_blank"
			href="https://github.com/dcdunkan/retlab-generate/blob/main/generated/api-endpoints.ts"
			>API endpoints</a
		>,
		<a
			target="_blank"
			href="https://github.com/dcdunkan/retlab-generate/blob/main/generated/models.d.ts"
			>data models</a
		>, and while I'm at it, a
		<a
			target="_blank"
			href="https://github.com/dcdunkan/retlab-generate/blob/main/generated/hoppscotch-collection.json"
			>Hoppscotch collection</a
		> too.
	</p>

	<p>
		And I started building Ret, working on it on my free time. One feature at a time. It's not
		AI-assisted. So, it's slow-cooked (sometimes I burn it by breaking stuff in production), and I
		try to research well while implementing each feature.
	</p>
</section>

<section>
	<h2>Ret's Goals</h2>

	<p>Ret has a few <b>goals and non-goals</b> that may or may not get updated in the future.</p>

	<h3>Goals</h3>

	<ul>
		<li>It's a lab after all. So, implement cool stuff.</li>
		<li>Only implement features from Etlab that are useful & needed.</li>
		<li>
			Somewhat reliable notifications based on service workers. See <a
				target="_blank"
				href="https://github.com/dcdunkan/retlab-notifications">retlab-notifications</a
			>.
		</li>
		<li>No survey annoyance + auto-fill.</li>
		<li>Help with keeping attendance & skipping classes.</li>
		<li>Don't hit rate limits on dashboard API.</li>
		<li>Consistency with web & app APIs by implementing web access.</li>
	</ul>

	<h3>Non-goals</h3>

	<ul>
		<li>Implement every feature.</li>
		<li>Touch anything with payments.</li>
	</ul>
</section>

<section>
	<h2>Ret, Retlab & Pronounciation</h2>

	<div class="flex flex-wrap gap-1">
		<Button variant="outline" size="sm" {@attach ipaRet()}>
			<SpeakerHighIcon weight="bold" /> Ret
		</Button>
		<Button variant="outline" size="sm" {@attach ipaRetlab()}>
			<SpeakerHighIcon weight="bold" /> Retlab
		</Button>
	</div>

	<p>
		As you can see, Retlab is the full name and Ret is the short name. But, for
		&ldquo;historical&rdquo; purposes & convenience, they are pronounced different from each other.
	</p>

	<ul>
		<li>
			<b>Retlab</b>:
			<a target="_blank" href="https://ipa-reader.com/?text=%CB%88r%C9%AA%20ti%CB%90%20l%C3%A6b"
				>/ˈrɪ tiː læb/</a
			>, pronounced <code class="text-ret-accent">rih-tee-lab</code>.
		</li>
		<li>
			<b>Ret</b>: <a target="_blank" href="https://ipa-reader.com/?text=%C9%B9%C9%9Bt">/ɹɛt/</a>,
			pronounced
			<code class="text-ret-accent">ret</code>.
		</li>
	</ul>

	<p>
		"Retlab" is supposed to be a "Re"-do of "Etlab", although the whole thing started out as
		"etlab-re" (which stands for "Etlab reverse-engineered").
	</p>
</section>

<section>
	<h2>Related Stuff</h2>

	<p>Some projects that are related to Ret:</p>

	<ul>
		<li>
			Notification server: <a
				target="_blank"
				href="https://github.com/dcdunkan/retlab-notifications">retlab-notifications</a
			>.
		</li>
		<li>
			Parsing & extracting useful stuff from Etlab's Android application: <a
				target="_blank"
				href="https://github.com/dcdunkan/retlab-generate">retlab-generate</a
			>.
		</li>
	</ul>
</section>

<section>
	<h2>About the Developer</h2>

	<p>
		I'm Sheron (<a target="_blank" href="https://github.com/dcdunkan">@dcdunkan</a>), a final year
		B.Tech Computer Science and Engineering student at
		<a target="_blank" href="https://tkmce.ac.in">TKM College of Engineering, Kollam, Kerala</a>. I
		like building nice software for humans. I'm good at experiencing and finding root problems &
		issues, great at complaining about them, and hard-working at solving them.
	</p>
</section>
