<script lang="ts">
	import { onMount } from 'svelte';
	import '#lib/loam/base.css';
	import '#lib/ios.css';

	let { children } = $props();

	// When a new service worker takes over, reload once so the new version shows.
	// If the person is typing, wait until they leave the app so no draft is lost.
	onMount(() => {
		const sw = navigator.serviceWorker;
		if (!sw?.controller) return; // first install: this page is already current

		let reloading = false;
		const reload = () => {
			if (reloading) return;
			reloading = true;
			location.reload();
		};
		const isTyping = () => {
			const el = document.activeElement;
			return el instanceof HTMLInputElement && el.value.trim() !== '';
		};
		const reloadWhenHidden = () => {
			if (document.visibilityState === 'hidden') reload();
		};
		const onControllerChange = () => {
			if (isTyping()) document.addEventListener('visibilitychange', reloadWhenHidden);
			else reload();
		};

		sw.addEventListener('controllerchange', onControllerChange);
		return () => {
			sw.removeEventListener('controllerchange', onControllerChange);
			document.removeEventListener('visibilitychange', reloadWhenHidden);
		};
	});
</script>

{@render children()}
