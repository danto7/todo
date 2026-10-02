<script lang="ts" module>
	// Subset of the Loam icon set (24 grid, 1.5 stroke, currentColor), plus `select`
	// (a check in a circle) drawn on the same grid for the iOS-style select mode.
	const PATHS = {
		select: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM8 12.5l2.75 2.75L16.5 9.5',
		plus: 'M12 5v14M5 12h14',
		x: 'M6 6l12 12M18 6L6 18',
		check: 'M5 12.5l4.5 4.5L19 7',
		'chevron-right': 'M9 6l6 6-6 6',
		inbox: 'M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5',
		trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13'
	};
	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 16, stroke = 1.5 }: { name: IconName; size?: number; stroke?: number } =
		$props();
</script>

<svg class="lm-icon" stroke-width={stroke} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
	<path d={PATHS[name]} />
</svg>

<style>
	.lm-icon {
		display: inline-block;
		flex: none;
		vertical-align: middle;
		fill: none;
		stroke: currentColor;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
