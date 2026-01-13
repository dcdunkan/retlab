# Retlab

> a true work in progress.

Retlab ([/ˈrɪ tiː læb/](https://ipa-reader.com/?text=%CB%88r%C9%AA%20ti%CB%90%20l%C3%A6b), pronounced `rih-tee-lab`) is a slightly convenient unofficial client for ETlab, built out of pure frustration with the official app. Use Retlab at <https://ret.dunked.dev>.

The official app is true garbage: slow, buggy, and has the most terrible UX.
Retlab uses the same backend with a lot of hacks and workarounds, but keeps the client small and reliable.

The API endpoints and types are generated and documented by parsing the Etlab android `.apk` files with magic. See: <https://github.com/dcdunkan/retlab-generate>.

### Goals

- Only implement features that are needed.
- Reliable notifications based on service workers.
- No survey annoyance + auto-fill.
- Help with keeping attendance & skipping classes.
- Don't hit rate limits on dashboard API.
- Consistency with web & app APIs by implementing web access.

### Non-goals

- Implement every features.
- Touch anything with payments.

Licensed under GPLv3.
