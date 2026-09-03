import type { StorageLike } from '$lib/project-state';

interface TokenLedger {
	records: Record<string, number>;
}

export function tokenLedgerKey(projectId: string): string {
	return `ideation-akinator:tokens:${projectId}`;
}

export function recordTokenUsage(
	storage: StorageLike,
	projectId: string,
	id: string,
	total: number
): number {
	const ledger = loadLedger(storage, projectId);
	if (Number.isFinite(total) && total > 0) ledger.records[id] = Math.floor(total);
	storage.setItem(tokenLedgerKey(projectId), JSON.stringify(ledger));
	return totalRecordedTokens(storage, projectId);
}

export function recordResponseTokenUsage(
	storage: StorageLike,
	projectId: string,
	response: Response
): number {
	const total = Number(response.headers.get('x-token-usage-total') ?? 0);
	const id = response.headers.get('x-request-id') ?? `response:${Date.now()}`;
	return recordTokenUsage(storage, projectId, id, total);
}

export function totalRecordedTokens(storage: StorageLike, projectId: string): number {
	return Object.values(loadLedger(storage, projectId).records).reduce(
		(sum, value) => sum + value,
		0
	);
}

export function clearTokenUsage(storage: StorageLike, projectId: string): void {
	storage.removeItem(tokenLedgerKey(projectId));
}

function loadLedger(storage: StorageLike, projectId: string): TokenLedger {
	try {
		const parsed: unknown = JSON.parse(storage.getItem(tokenLedgerKey(projectId)) ?? 'null');
		if (!parsed || typeof parsed !== 'object') return { records: {} };
		const raw = (parsed as { records?: unknown }).records;
		if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { records: {} };
		const records = Object.fromEntries(
			Object.entries(raw).filter(
				(entry): entry is [string, number] =>
					typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] >= 0
			)
		);
		return { records };
	} catch {
		return { records: {} };
	}
}
