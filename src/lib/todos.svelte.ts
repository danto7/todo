import { createTodo, type Todo } from './todo';
import { localTodoStorage, type TodoStorage } from './storage';

export type Filter = 'all' | 'open' | 'done';

export class TodoList {
	items = $state<Todo[]>([]);
	filter = $state<Filter>('all');

	visible = $derived(
		this.items.filter((t) =>
			this.filter === 'all'
				? true
				: this.filter === 'open'
					? t.status !== 'COMPLETED'
					: t.status === 'COMPLETED'
		)
	);
	openCount = $derived(this.items.filter((t) => t.status !== 'COMPLETED').length);
	doneCount = $derived(this.items.length - this.openCount);

	#storage: TodoStorage;

	constructor(storage: TodoStorage = localTodoStorage) {
		this.#storage = storage;
		this.items = storage.load();
	}

	add(summary: string) {
		const text = summary.trim();
		if (!text) return;
		this.items.unshift(createTodo(text));
		this.#persist();
	}

	toggle(uid: string) {
		this.#update(uid, (t) => {
			const done = t.status !== 'COMPLETED';
			t.status = done ? 'COMPLETED' : 'NEEDS-ACTION';
			t.completed = done ? new Date().toISOString() : undefined;
		});
	}

	rename(uid: string, summary: string) {
		const text = summary.trim();
		if (!text) return this.remove(uid);
		this.#update(uid, (t) => (t.summary = text));
	}

	remove(uid: string) {
		this.items = this.items.filter((t) => t.uid !== uid);
		this.#persist();
	}

	clearCompleted() {
		this.items = this.items.filter((t) => t.status !== 'COMPLETED');
		this.#persist();
	}

	#update(uid: string, fn: (t: Todo) => void) {
		const todo = this.items.find((t) => t.uid === uid);
		if (!todo) return;
		fn(todo);
		todo.lastModified = new Date().toISOString();
		this.#persist();
	}

	#persist() {
		this.#storage.save($state.snapshot(this.items));
	}
}
