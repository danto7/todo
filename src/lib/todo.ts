/**
 * A to-do item. Field names and semantics deliberately mirror the iCalendar
 * VTODO component (RFC 5545) so items can later be synced to a CalDAV server
 * (Nextcloud, Radicale, Baïkal, …) without a lossy mapping.
 */
export interface Todo {
	/** VTODO `UID` */
	uid: string;
	/** VTODO `SUMMARY` */
	summary: string;
	/** VTODO `STATUS` */
	status: 'NEEDS-ACTION' | 'COMPLETED';
	/** VTODO `CREATED`, ISO 8601 */
	created: string;
	/** VTODO `LAST-MODIFIED`, ISO 8601 */
	lastModified: string;
	/** VTODO `COMPLETED`, ISO 8601 */
	completed?: string;
}

export function createTodo(summary: string): Todo {
	const now = new Date().toISOString();
	return {
		uid: crypto.randomUUID(),
		summary,
		status: 'NEEDS-ACTION',
		created: now,
		lastModified: now
	};
}
