<script lang="ts">
	import { tick } from 'svelte';
	import { TodoList, type Filter } from '#lib/todos.svelte.ts';

	const list = new TodoList();

	let draft = $state('');
	let editing = $state<string | null>(null);
	let editDraft = $state('');

	const filters: { value: Filter; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'open', label: 'Open' },
		{ value: 'done', label: 'Done' }
	];

	function submit(event: SubmitEvent) {
		event.preventDefault();
		list.add(draft);
		draft = '';
	}

	async function startEdit(uid: string, summary: string) {
		editing = uid;
		editDraft = summary;
		await tick();
		document.querySelector<HTMLInputElement>(`[data-edit="${uid}"]`)?.focus();
	}

	function commitEdit() {
		if (editing) list.rename(editing, editDraft);
		editing = null;
	}

	function onEditKey(event: KeyboardEvent) {
		if (event.key === 'Enter') commitEdit();
		if (event.key === 'Escape') editing = null;
	}

	const emptyText = $derived(
		list.filter === 'done'
			? 'Nothing completed yet.'
			: list.filter === 'open' && list.items.length
				? 'All done! 🎉'
				: 'No to-dos yet. Add one below.'
	);
</script>

<div class="app">
	<header>
		<h1>To-do</h1>
		<p class="summary">{list.openCount} open · {list.doneCount} done</p>

		<div class="segmented" role="tablist" aria-label="Filter">
			{#each filters as f (f.value)}
				<button
					role="tab"
					aria-selected={list.filter === f.value}
					class:active={list.filter === f.value}
					onclick={() => (list.filter = f.value)}>{f.label}</button
				>
			{/each}
		</div>
	</header>

	<main>
		{#if list.visible.length === 0}
			<p class="empty">{emptyText}</p>
		{:else}
			<ul>
				{#each list.visible as todo (todo.uid)}
					{@const done = todo.status === 'COMPLETED'}
					<li class:done>
						<button
							class="check"
							role="checkbox"
							aria-checked={done}
							aria-label={done ? 'Mark as open' : 'Mark as done'}
							onclick={() => list.toggle(todo.uid)}
						>
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
						</button>

						{#if editing === todo.uid}
							<input
								class="edit"
								data-edit={todo.uid}
								bind:value={editDraft}
								onblur={commitEdit}
								onkeydown={onEditKey}
								enterkeyhint="done"
								aria-label="Edit to-do"
							/>
						{:else}
							<button class="text" onclick={() => startEdit(todo.uid, todo.summary)}>
								{todo.summary}
							</button>
						{/if}

						<button class="delete" aria-label="Delete" onclick={() => list.remove(todo.uid)}>
							<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		{#if list.doneCount > 0}
			<button class="clear" onclick={() => list.clearCompleted()}>
				Clear {list.doneCount} completed
			</button>
		{/if}
	</main>

	<form class="composer" onsubmit={submit}>
		<input
			bind:value={draft}
			placeholder="Add a to-do…"
			aria-label="New to-do"
			enterkeyhint="send"
			autocomplete="off"
		/>
		<button type="submit" aria-label="Add" disabled={!draft.trim()}>
			<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
		</button>
	</form>
</div>

<style>
	.app {
		max-width: 640px;
		margin: 0 auto;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	header {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: calc(env(safe-area-inset-top) + 16px) 16px 12px;
		background: var(--bg);
	}

	h1 {
		margin: 0;
		font-size: 2rem;
		letter-spacing: -0.02em;
	}

	.summary {
		margin: 2px 0 14px;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.segmented {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		padding: 3px;
		border-radius: 10px;
		background: var(--border);
	}

	.segmented button {
		border: 0;
		background: transparent;
		padding: 8px 0;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.segmented button.active {
		background: var(--surface);
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.12);
	}

	main {
		flex: 1;
		padding: 4px 16px 16px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		border-radius: 14px;
		overflow: hidden;
		background: var(--surface);
		border: 1px solid var(--border);
	}

	li {
		display: flex;
		align-items: center;
		gap: 4px;
		min-height: 56px;
		padding-left: 6px;
	}

	li + li {
		border-top: 1px solid var(--border);
	}

	button {
		cursor: pointer;
	}

	.check,
	.delete {
		flex: none;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border: 0;
		background: transparent;
	}

	.check svg {
		width: 26px;
		height: 26px;
		padding: 3px;
		border-radius: 50%;
		border: 2px solid var(--muted);
		fill: none;
		stroke: transparent;
		stroke-width: 3;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition:
			background 0.15s,
			border-color 0.15s;
	}

	.done .check svg {
		background: var(--accent);
		border-color: var(--accent);
		stroke: #fff;
	}

	.text {
		flex: 1;
		min-width: 0;
		padding: 14px 4px;
		border: 0;
		background: transparent;
		text-align: left;
		font-size: 1.05rem;
		overflow-wrap: anywhere;
	}

	.done .text {
		color: var(--muted);
		text-decoration: line-through;
	}

	.edit {
		flex: 1;
		min-width: 0;
		padding: 10px 8px;
		border: 1px solid var(--accent);
		border-radius: 8px;
		background: var(--bg);
		font-size: 1.05rem;
		outline: none;
	}

	.delete svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: var(--muted);
		stroke-width: 2;
		stroke-linecap: round;
	}

	.delete:active svg {
		stroke: var(--danger);
	}

	.empty {
		margin: 48px 0;
		text-align: center;
		color: var(--muted);
	}

	.clear {
		display: block;
		margin: 16px auto 0;
		padding: 10px 16px;
		border: 0;
		background: transparent;
		color: var(--danger);
		font-size: 0.95rem;
	}

	.composer {
		position: sticky;
		bottom: 0;
		display: flex;
		gap: 8px;
		padding: 10px 16px calc(env(safe-area-inset-bottom) + 10px);
		background: var(--bg);
		border-top: 1px solid var(--border);
	}

	.composer input {
		flex: 1;
		min-width: 0;
		height: 48px;
		padding: 0 16px;
		border: 1px solid var(--border);
		border-radius: 24px;
		background: var(--surface);
		/* 16px+ prevents iOS Safari from zooming on focus */
		font-size: 1rem;
		outline: none;
	}

	.composer input:focus {
		border-color: var(--accent);
	}

	.composer button {
		flex: none;
		width: 48px;
		height: 48px;
		border: 0;
		border-radius: 50%;
		background: var(--accent);
		display: grid;
		place-items: center;
	}

	.composer button:disabled {
		opacity: 0.4;
	}

	.composer svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: #fff;
		stroke-width: 2.5;
		stroke-linecap: round;
	}
</style>
