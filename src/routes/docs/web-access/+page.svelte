<section>
	<h2>What is it?</h2>

	<p>
		Ret uses the same APIs as Etlab android app. But, Web access allows you to use supported
		features from Etlab web in Ret.
	</p>
</section>

<section>
	<h2>The Story</h2>

	<p>
		I started Ret because their Android application sucks, and it was not at all consistent with the
		their website. And the app would break & be down for many reasons. Website, even though
		presented very unpleasantly, would be up even when the apps are down, and it has a lot more
		completed features and many of its pages are filled with data, which is missing in the native
		apps.
	</p>

	<p>
		The original goal was to implement a feature, that allowed users to use Ret, even if the Etlab
		native apps are down. If the APIs native apps relied on were down, Ret could temporarily switch
		to scraping the website instead. But, implementing total equivalency between Etlab APIs and
		Etlab web seemed very unnecessary & too much work at the time. So, I dropped my web access
		plans.
	</p>

	<p>
		But, one of the fun feature in Etlab web is <q>Academic Analysis</q>, which is not implemented
		in the Android application. The page is very data-rich, showing your per-semester grades,
		subject, sessional examination marks, class rank, class average, attendance, and a lot more. And
		the webpage has code for rendering nice graphs off of it. But, since the generated chart code is
		often not correct JavaScript syntax (it would interpolate orphan minus symbols directly), charts
		aren't shown for most users.
	</p>
	<p>
		When I saw all this data, I really wanted to show some cool charts in Ret as well. But there are
		no working APIs for that in Etlab. You will have to scrape and extract the information from
		Etlab's website. To do that, you need to login to the user's account via Etlab's web instance.
		So, my web-access plans were restarted again, limited though.
	</p>

	<p>
		<b>So... I implemented web access.</b> A feature that let's you login to Etlab web and access supported
		features from there.
	</p>
</section>

<section>
	<h2>Supported Features</h2>

	<p>Currently it powers the following Ret features (the list may grow in future):</p>

	<ul>
		<li><b>Academic analysis page;</b> the motivation to start implementing web access.</li>
		<li>
			<b>Assignment upload &amp; delete;</b> because the corresponding APIs for it were not working as
			expected. It would upload &amp; delete the files for real, but return 500 as status code. That would
			have been a manageable assumption &lpar;500 &equals; success&rpar;. But, they return 500 for failure
			too.
		</li>
	</ul>
</section>

<section>
	<h2>Security?! Password?</h2>

	<p>
		Web access needs you entering your Etlab account password each time you want to use a web access
		feature; because <b>Ret doesn't store your passwords</b>.
	</p>

	<p>
		The APIs used by the native apps rely on an access token provided upon log in. This access token
		has no practical expiry, and cannot be revoked either (not even by logging out). But, the
		website does not use access tokens, instead it uses sessions that expire (<a
			target="_blank"
			href="https://www.geeksforgeeks.org/computer-networks/session-vs-token-based-authentication/"
			>read more on the differences</a
		>). That's why you're asked to re-login after using the website for a while. And because Ret
		uses the native APIs, for web access, you need to login after each web session expires.
	</p>
</section>
