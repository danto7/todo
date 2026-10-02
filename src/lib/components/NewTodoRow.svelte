<script lang="ts">
	let {
		value = $bindable(''),
		input = $bindable(),
		onCommit,
		onClose
	}: {
		value: string;
		input?: HTMLInputElement;
		/** Return pressed with text: save it and keep the row open for the next one. */
		onCommit: () => void;
		/** Row left (blur, Escape, or Return on an empty row). */
		onClose: () => void;
	} = $props();

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (value.trim()) onCommit();
			else input?.blur();
		} else if (e.key === 'Escape') {
			value = '';
			input?.blur();
		}
	}
</script>

<!-- The empty row a new to-do is typed into, styled like TodoRow -->
<div class="content">
	<span class="check" aria-hidden="true"><span class="circle"></span></span>
	<input
		bind:this={input}
		bind:value
		onkeydown={onKey}
		onblur={onClose}
		placeholder="New to-do"
		aria-label="New to-do"
		enterkeyhint="next"
		autocomplete="off"
	/>
</div>

<style>
	.content {
		position: relative;
		display: flex;
		align-items: center;
		min-height: 44px;
		padding-right: var(--space-2);
		background: var(--surface-raised);
	}

	.content::after {
		content: '';
		position: absolute;
		left: 52px;
		right: 0;
		bottom: 0;
		height: 1px;
		background: var(--line);
		transform: scaleY(0.5);
		transform-origin: bottom;
	}

	:global(li:last-child) > .content::after {
		display: none;
	}

	.check {
		flex: none;
		display: grid;
		place-items: center;
		width: 52px;
		height: 44px;
		padding-left: var(--space-1);
	}

	.circle {
		width: 24px;
		height: 24px;
		border: 1.5px solid var(--line-strong);
		border-radius: 50%;
	}

	input {
		flex: 1;
		min-width: 0;
		height: 44px;
		padding: 0 var(--space-1) 0 0;
		border: 0;
		background: none;
		/* 17px also keeps iOS Safari from zooming on focus */
		font: 400 17px/22px var(--font-ui);
		color: var(--ink);
		caret-color: var(--accent);
		outline: none;
	}

	input::placeholder {
		color: var(--ink-muted);
	}
</style>
