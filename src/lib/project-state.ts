export const PROJECT_SCHEMA_VERSION = 2;
export const PROJECT_STORAGE_KEY = 'ideation-akinator:active-project';

export type WorkflowStage = 'welcome' | 'problem' | 'preferences';
export type IntakeStage = Exclude<WorkflowStage, 'welcome'>;
export type InnovationLevel = 1 | 2 | 3 | 4 | 5;

export interface ProblemCard {
	id: string;
	text: string;
}

export interface ProblemInput {
	topic: string;
	cards: ProblemCard[];
	clarityLabel: null;
	clarityReasons: string[];
	topicCoherenceWarning: null;
}

export interface ProjectConstraints {
	targetPlatform: string;
	deadline: string;
	teamSize: string;
	teamSkills: string;
	regulatory: string;
	accessibility: string;
	existingSystems: string;
	revenueModel: string;
	other: string;
}

export interface ProjectPreferences {
	technologyTags: string[];
	selectedIndustryTags: string[];
	dismissedIndustryTags: string[];
	innovationLevel: InnovationLevel;
	prototypeBudgetUsd: number | null;
	includeProductionPlanning: boolean;
	productionBudgetUsd: number | null;
	constraints: ProjectConstraints;
}

export interface ProjectSession {
	schemaVersion: typeof PROJECT_SCHEMA_VERSION;
	id: string;
	createdAt: string;
	updatedAt: string;
	stage: WorkflowStage;
	completedStages: IntakeStage[];
	invalidatedStages: string[];
	problemInput: ProblemInput;
	preferences: ProjectPreferences;
}

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export type ProjectLoadResult =
	| { status: 'empty'; project: null }
	| { status: 'ready'; project: ProjectSession }
	| { status: 'migrated'; project: ProjectSession }
	| { status: 'recovered'; project: null };

export function createProject(now = new Date(), id = createProjectId()): ProjectSession {
	const timestamp = now.toISOString();
	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id,
		createdAt: timestamp,
		updatedAt: timestamp,
		stage: 'welcome',
		completedStages: [],
		invalidatedStages: [],
		problemInput: createProblemInput(),
		preferences: createPreferences()
	};
}

export function createProblemCard(id = createProjectId()): ProblemCard {
	return { id, text: '' };
}

export function loadProject(storage: StorageLike): ProjectLoadResult {
	const stored = storage.getItem(PROJECT_STORAGE_KEY);
	if (!stored) return { status: 'empty', project: null };

	try {
		const parsed: unknown = JSON.parse(stored);
		if (isCurrentProject(parsed)) return { status: 'ready', project: parsed };

		const migrated = migrateVersionOne(parsed);
		if (migrated) {
			storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(migrated));
			return { status: 'migrated', project: migrated };
		}

		storage.removeItem(PROJECT_STORAGE_KEY);
		return { status: 'recovered', project: null };
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

function createProblemInput(): ProblemInput {
	return {
		topic: '',
		cards: [createProblemCard()],
		clarityLabel: null,
		clarityReasons: [],
		topicCoherenceWarning: null
	};
}

function createPreferences(): ProjectPreferences {
	return {
		technologyTags: [],
		selectedIndustryTags: [],
		dismissedIndustryTags: [],
		innovationLevel: 3,
		prototypeBudgetUsd: null,
		includeProductionPlanning: true,
		productionBudgetUsd: null,
		constraints: {
			targetPlatform: '',
			deadline: '',
			teamSize: '',
			teamSkills: '',
			regulatory: '',
			accessibility: '',
			existingSystems: '',
			revenueModel: '',
			other: ''
		}
	};
}

function migrateVersionOne(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	if (
		previous.schemaVersion !== 1 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		(previous.stage !== 'welcome' && previous.stage !== 'problem')
	) {
		return null;
	}

	return {
		...createProject(new Date(previous.createdAt), previous.id),
		updatedAt: previous.updatedAt,
		stage: previous.stage
	};
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
		isWorkflowStage(project.stage) &&
		isIntakeStageArray(project.completedStages) &&
		isStringArray(project.invalidatedStages) &&
		isProblemInput(project.problemInput) &&
		isPreferences(project.preferences)
	);
}

function isProblemInput(value: unknown): value is ProblemInput {
	if (!value || typeof value !== 'object') return false;
	const input = value as Partial<ProblemInput>;
	return (
		typeof input.topic === 'string' &&
		Array.isArray(input.cards) &&
		input.cards.length > 0 &&
		input.cards.every(
			(card) =>
				card &&
				typeof card === 'object' &&
				typeof (card as ProblemCard).id === 'string' &&
				typeof (card as ProblemCard).text === 'string'
		) &&
		input.clarityLabel === null &&
		isStringArray(input.clarityReasons) &&
		input.topicCoherenceWarning === null
	);
}

function isPreferences(value: unknown): value is ProjectPreferences {
	if (!value || typeof value !== 'object') return false;
	const preferences = value as Partial<ProjectPreferences>;
	const constraints = preferences.constraints as Partial<ProjectConstraints> | undefined;
	return (
		isStringArray(preferences.technologyTags) &&
		isStringArray(preferences.selectedIndustryTags) &&
		isStringArray(preferences.dismissedIndustryTags) &&
		isInnovationLevel(preferences.innovationLevel) &&
		isNullableBudget(preferences.prototypeBudgetUsd) &&
		typeof preferences.includeProductionPlanning === 'boolean' &&
		isNullableBudget(preferences.productionBudgetUsd) &&
		!!constraints &&
		Object.values(constraints).every((entry) => typeof entry === 'string') &&
		Object.keys(createPreferences().constraints).every((key) => key in constraints)
	);
}

function isWorkflowStage(value: unknown): value is WorkflowStage {
	return value === 'welcome' || value === 'problem' || value === 'preferences';
}

function isInnovationLevel(value: unknown): value is InnovationLevel {
	return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isNullableBudget(value: unknown): value is number | null {
	return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
}

function isStringArray(value: unknown): value is string[] {
	return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isIntakeStageArray(value: unknown): value is IntakeStage[] {
	return (
		Array.isArray(value) && value.every((entry) => entry === 'problem' || entry === 'preferences')
	);
}

function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function createProjectId(): string {
	return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now().toString(36)}`;
}
