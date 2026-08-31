export const PROJECT_SCHEMA_VERSION = 1;
export const PROJECT_STORAGE_KEY = 'ideation-akinator:active-project';

export type WorkflowStage = 'welcome' | 'problem';

export interface ProjectSession {
	schemaVersion: typeof PROJECT_SCHEMA_VERSION;
	id: string;
	createdAt: string;
	updatedAt: string;
	stage: WorkflowStage;
}

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export type ProjectLoadResult =
	| { status: 'empty'; project: null }
	| { status: 'ready'; project: ProjectSession }
	| { status: 'recovered'; project: null };

export function createProject(now = new Date(), id = createProjectId()): ProjectSession {
	const timestamp = now.toISOString();
	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id,
		createdAt: timestamp,
		updatedAt: timestamp,
		stage: 'welcome'
	};
}

export function loadProject(storage: StorageLike): ProjectLoadResult {
	const stored = storage.getItem(PROJECT_STORAGE_KEY);
	if (!stored) return { status: 'empty', project: null };

	try {
		const parsed: unknown = JSON.parse(stored);
		if (!isCurrentProject(parsed)) {
			storage.removeItem(PROJECT_STORAGE_KEY);
			return { status: 'recovered', project: null };
		}

		return { status: 'ready', project: parsed };
	} catch {
		storage.removeItem(PROJECT_STORAGE_KEY);
		return { status: 'recovered', project: null };
	}
}

export function saveProject(
	storage: StorageLike,
	project: ProjectSession,
	now = new Date()
): ProjectSession {
	const updated = { ...project, updatedAt: now.toISOString() };
	storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(updated));
	return updated;
}

export function clearProject(storage: StorageLike): void {
	storage.removeItem(PROJECT_STORAGE_KEY);
}

function isCurrentProject(value: unknown): value is ProjectSession {
	if (!value || typeof value !== 'object') return false;

	const project = value as Partial<ProjectSession>;
	return (
		project.schemaVersion === PROJECT_SCHEMA_VERSION &&
		typeof project.id === 'string' &&
		project.id.length > 0 &&
		isIsoDate(project.createdAt) &&
		isIsoDate(project.updatedAt) &&
		(project.stage === 'welcome' || project.stage === 'problem')
	);
}

function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function createProjectId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now().toString(36)}`;
}
