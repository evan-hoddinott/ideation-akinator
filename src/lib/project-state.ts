import { isClarityLabel, type ClarityLabel } from '$lib/intake-insights';
import {
	createConceptState,
	parseProjectConceptState,
	type ProjectConceptState
} from '$lib/concepts';
import { createInterview, parseProjectInterview, type ProjectInterview } from '$lib/interview';
import {
	createFeatureWorkshop,
	parseFeatureWorkshopState,
	type FeatureWorkshopState
} from '$lib/feature-workshop';
import {
	createProjectFinalization,
	parseProjectFinalization,
	type ProjectFinalization
} from '$lib/finalization';
import {
	createSagePersonality,
	parseSagePersonality,
	type SagePersonality
} from '$lib/personality';
import {
	isResearchJobStatus,
	parseBroadResearchResult,
	type BroadResearchResult,
	type ResearchJobStatus
} from '$lib/research';

export const PROJECT_SCHEMA_VERSION = 9;
export const PROJECT_STORAGE_KEY = 'ideation-akinator:active-project';

export type WorkflowStage =
	'welcome' | 'problem' | 'preferences' | 'research' | 'questions' | 'concepts' | 'focused';
export type CompletedStage = Exclude<WorkflowStage, 'welcome'>;
export type InnovationLevel = 1 | 2 | 3 | 4 | 5;

export interface ProblemCard {
	id: string;
	text: string;
}

export interface ProblemInput {
	topic: string;
	cards: ProblemCard[];
	clarityLabel: ClarityLabel | null;
	clarityReasons: string[];
	topicCoherenceWarning: string | null;
}

export interface ProjectConstraints {
	excludedTechnologies?: string;
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
	suggestedTechnologyTags?: string[];
	dismissedTechnologyTags?: string[];
	technologyTags: string[];
	selectedIndustryTags: string[];
	dismissedIndustryTags: string[];
	suggestedIndustryTags: string[];
	innovationLevel: InnovationLevel;
	prototypeBudgetUsd: number | null;
	includeProductionPlanning: boolean;
	productionBudgetUsd: number | null;
	constraints: ProjectConstraints;
}

export interface ProjectResearch {
	jobId: string | null;
	status: 'idle' | ResearchJobStatus;
	result: BroadResearchResult | null;
}

export interface ProjectSession {
	schemaVersion: typeof PROJECT_SCHEMA_VERSION;
	id: string;
	createdAt: string;
	updatedAt: string;
	stage: WorkflowStage;
	completedStages: CompletedStage[];
	invalidatedStages: string[];
	problemInput: ProblemInput;
	preferences: ProjectPreferences;
	research: ProjectResearch;
	interview: ProjectInterview;
	concepts: ProjectConceptState;
	featureWorkshop: FeatureWorkshopState;
	finalization: ProjectFinalization;
	personality: SagePersonality;
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
		preferences: createPreferences(),
		research: createResearch(),
		interview: createInterview(),
		concepts: createConceptState(),
		featureWorkshop: createFeatureWorkshop(null),
		finalization: createProjectFinalization(),
		personality: createSagePersonality()
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

		const migrated =
			migrateVersionEight(parsed) ??
			migrateVersionSeven(parsed) ??
			migrateVersionSix(parsed) ??
			migrateVersionFive(parsed) ??
			migrateVersionFour(parsed) ??
			migrateVersionThree(parsed) ??
			migrateVersionTwo(parsed) ??
			migrateVersionOne(parsed);
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
		suggestedIndustryTags: [],
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

function createResearch(): ProjectResearch {
	return { jobId: null, status: 'idle', result: null };
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

function migrateVersionTwo(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	if (
		previous.schemaVersion !== 2 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		(previous.stage !== 'welcome' &&
			previous.stage !== 'problem' &&
			previous.stage !== 'preferences') ||
		!isLegacyIntakeStageArray(previous.completedStages) ||
		!isStringArray(previous.invalidatedStages) ||
		!isVersionTwoProblemInput(previous.problemInput) ||
		!isVersionTwoPreferences(previous.preferences)
	) {
		return null;
	}

	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id: previous.id,
		createdAt: previous.createdAt,
		updatedAt: previous.updatedAt,
		stage: previous.stage,
		completedStages: previous.completedStages,
		invalidatedStages: previous.invalidatedStages,
		problemInput: { ...previous.problemInput },
		preferences: { ...previous.preferences, suggestedIndustryTags: [] },
		research: createResearch(),
		interview: createInterview(),
		concepts: createConceptState(),
		featureWorkshop: createFeatureWorkshop(null),
		finalization: createProjectFinalization(),
		personality: createSagePersonality()
	};
}

function migrateVersionThree(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	if (
		previous.schemaVersion !== 3 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		(previous.stage !== 'welcome' &&
			previous.stage !== 'problem' &&
			previous.stage !== 'preferences') ||
		!isCompletedStageArray(previous.completedStages) ||
		!isStringArray(previous.invalidatedStages) ||
		!isProblemInput(previous.problemInput) ||
		!isPreferences(previous.preferences)
	) {
		return null;
	}

	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id: previous.id,
		createdAt: previous.createdAt,
		updatedAt: previous.updatedAt,
		stage: previous.stage,
		completedStages: previous.completedStages,
		invalidatedStages: previous.invalidatedStages,
		problemInput: previous.problemInput,
		preferences: previous.preferences,
		research: createResearch(),
		interview: createInterview(),
		concepts: createConceptState(),
		featureWorkshop: createFeatureWorkshop(null),
		finalization: createProjectFinalization(),
		personality: createSagePersonality()
	};
}

function migrateVersionFour(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	if (
		previous.schemaVersion !== 4 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		(previous.stage !== 'welcome' &&
			previous.stage !== 'problem' &&
			previous.stage !== 'preferences' &&
			previous.stage !== 'research') ||
		!isVersionFourCompletedStageArray(previous.completedStages) ||
		!isStringArray(previous.invalidatedStages) ||
		!isProblemInput(previous.problemInput) ||
		!isPreferences(previous.preferences) ||
		!isResearch(previous.research)
	) {
		return null;
	}

	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id: previous.id,
		createdAt: previous.createdAt,
		updatedAt: previous.updatedAt,
		stage: previous.stage,
		completedStages: previous.completedStages,
		invalidatedStages: previous.invalidatedStages,
		problemInput: previous.problemInput,
		preferences: previous.preferences,
		research: previous.research,
		interview: createInterview(),
		concepts: createConceptState(),
		featureWorkshop: createFeatureWorkshop(null),
		finalization: createProjectFinalization(),
		personality: createSagePersonality()
	};
}

function migrateVersionFive(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	const interview = parseProjectInterview(previous.interview);
	if (
		previous.schemaVersion !== 5 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		!isVersionSixWorkflowStage(previous.stage) ||
		!isVersionSixCompletedStageArray(previous.completedStages) ||
		!isStringArray(previous.invalidatedStages) ||
		!isProblemInput(previous.problemInput) ||
		!isPreferences(previous.preferences) ||
		!isResearch(previous.research) ||
		!interview
	) {
		return null;
	}

	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id: previous.id,
		createdAt: previous.createdAt,
		updatedAt: previous.updatedAt,
		stage: previous.stage,
		completedStages: previous.completedStages,
		invalidatedStages: previous.invalidatedStages,
		problemInput: previous.problemInput,
		preferences: previous.preferences,
		research: previous.research,
		interview,
		concepts: createConceptState(),
		featureWorkshop: createFeatureWorkshop(null),
		finalization: createProjectFinalization(),
		personality: createSagePersonality()
	};
}

function migrateVersionSix(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	const interview = parseProjectInterview(previous.interview);
	const personality = parseSagePersonality(previous.personality);
	if (
		previous.schemaVersion !== 6 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		!isVersionSixWorkflowStage(previous.stage) ||
		!isVersionSixCompletedStageArray(previous.completedStages) ||
		!isStringArray(previous.invalidatedStages) ||
		!isProblemInput(previous.problemInput) ||
		!isPreferences(previous.preferences) ||
		!isResearch(previous.research) ||
		!interview ||
		!personality
	) {
		return null;
	}

	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id: previous.id,
		createdAt: previous.createdAt,
		updatedAt: previous.updatedAt,
		stage: previous.stage,
		completedStages: previous.completedStages,
		invalidatedStages: previous.invalidatedStages,
		problemInput: previous.problemInput,
		preferences: previous.preferences,
		research: previous.research,
		interview,
		concepts: createConceptState(),
		featureWorkshop: createFeatureWorkshop(null),
		finalization: createProjectFinalization(),
		personality
	};
}

function migrateVersionSeven(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	const interview = parseProjectInterview(previous.interview);
	const concepts = parseProjectConceptState(previous.concepts);
	const personality = parseSagePersonality(previous.personality);
	if (
		previous.schemaVersion !== 7 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		!isWorkflowStage(previous.stage) ||
		!isCompletedStageArray(previous.completedStages) ||
		!isStringArray(previous.invalidatedStages) ||
		!isProblemInput(previous.problemInput) ||
		!isPreferences(previous.preferences) ||
		!isResearch(previous.research) ||
		!interview ||
		!concepts ||
		!personality
	) {
		return null;
	}

	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id: previous.id,
		createdAt: previous.createdAt,
		updatedAt: previous.updatedAt,
		stage: previous.stage,
		completedStages: previous.completedStages,
		invalidatedStages: previous.invalidatedStages,
		problemInput: previous.problemInput,
		preferences: previous.preferences,
		research: previous.research,
		interview,
		concepts,
		featureWorkshop: createFeatureWorkshop(concepts.portfolio),
		finalization: createProjectFinalization(),
		personality
	};
}

function migrateVersionEight(value: unknown): ProjectSession | null {
	if (!value || typeof value !== 'object') return null;
	const previous = value as Record<string, unknown>;
	const interview = parseProjectInterview(previous.interview);
	const concepts = parseProjectConceptState(previous.concepts);
	const featureWorkshop = parseFeatureWorkshopState(previous.featureWorkshop);
	const personality = parseSagePersonality(previous.personality);
	if (
		previous.schemaVersion !== 8 ||
		typeof previous.id !== 'string' ||
		previous.id.length === 0 ||
		!isIsoDate(previous.createdAt) ||
		!isIsoDate(previous.updatedAt) ||
		!isVersionEightWorkflowStage(previous.stage) ||
		!isVersionEightCompletedStageArray(previous.completedStages) ||
		!isStringArray(previous.invalidatedStages) ||
		!isProblemInput(previous.problemInput) ||
		!isPreferences(previous.preferences) ||
		!isResearch(previous.research) ||
		!interview ||
		!concepts ||
		!featureWorkshop ||
		!featureWorkshopMatchesConcepts(featureWorkshop, concepts) ||
		!personality
	) {
		return null;
	}

	return {
		schemaVersion: PROJECT_SCHEMA_VERSION,
		id: previous.id,
		createdAt: previous.createdAt,
		updatedAt: previous.updatedAt,
		stage: previous.stage,
		completedStages: previous.completedStages,
		invalidatedStages: previous.invalidatedStages,
		problemInput: previous.problemInput,
		preferences: previous.preferences,
		research: previous.research,
		interview,
		concepts,
		featureWorkshop,
		finalization: createProjectFinalization(),
		personality
	};
}

function isCurrentProject(value: unknown): value is ProjectSession {
	if (!value || typeof value !== 'object') return false;
	const project = value as Partial<ProjectSession>;
	const concepts = parseProjectConceptState(project.concepts);
	const featureWorkshop = parseFeatureWorkshopState(project.featureWorkshop);
	const finalization = parseProjectFinalization(project.finalization);
	return (
		project.schemaVersion === PROJECT_SCHEMA_VERSION &&
		typeof project.id === 'string' &&
		project.id.length > 0 &&
		isIsoDate(project.createdAt) &&
		isIsoDate(project.updatedAt) &&
		isWorkflowStage(project.stage) &&
		isCompletedStageArray(project.completedStages) &&
		isStringArray(project.invalidatedStages) &&
		isProblemInput(project.problemInput) &&
		isPreferences(project.preferences) &&
		isResearch(project.research) &&
		!!parseProjectInterview(project.interview) &&
		!!concepts &&
		!!featureWorkshop &&
		featureWorkshopMatchesConcepts(featureWorkshop, concepts) &&
		!!finalization &&
		!!parseSagePersonality(project.personality)
	);
}

function featureWorkshopMatchesConcepts(
	workshop: FeatureWorkshopState,
	concepts: ProjectConceptState
): boolean {
	if (!concepts.portfolio)
		return workshop.status === 'idle' && workshop.configurations.length === 0;
	const conceptIds = new Set(concepts.portfolio.concepts.map((concept) => concept.id));
	return (
		workshop.configurations.length === conceptIds.size &&
		workshop.configurations.every((configuration) => conceptIds.has(configuration.conceptId))
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
		(input.clarityLabel === null || isClarityLabel(input.clarityLabel)) &&
		isStringArray(input.clarityReasons) &&
		(input.topicCoherenceWarning === null || typeof input.topicCoherenceWarning === 'string')
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
		isStringArray(preferences.suggestedIndustryTags) &&
		(preferences.suggestedTechnologyTags === undefined ||
			isStringArray(preferences.suggestedTechnologyTags)) &&
		(preferences.dismissedTechnologyTags === undefined ||
			isStringArray(preferences.dismissedTechnologyTags)) &&
		isInnovationLevel(preferences.innovationLevel) &&
		isNullableBudget(preferences.prototypeBudgetUsd) &&
		typeof preferences.includeProductionPlanning === 'boolean' &&
		isNullableBudget(preferences.productionBudgetUsd) &&
		!!constraints &&
		Object.values(constraints).every((entry) => typeof entry === 'string') &&
		Object.keys(createPreferences().constraints).every((key) => key in constraints)
	);
}

function isResearch(value: unknown): value is ProjectResearch {
	if (!value || typeof value !== 'object') return false;
	const research = value as Partial<ProjectResearch>;
	const validStatus = research.status === 'idle' || isResearchJobStatus(research.status);
	const validResult = research.result === null || !!parseBroadResearchResult(research.result);
	const activeHasJob =
		(research.status !== 'queued' && research.status !== 'running') ||
		typeof research.jobId === 'string';
	return (
		(research.jobId === null || typeof research.jobId === 'string') &&
		validStatus &&
		validResult &&
		activeHasJob
	);
}

function isVersionTwoProblemInput(value: unknown): value is ProblemInput {
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

function isVersionTwoPreferences(
	value: unknown
): value is Omit<ProjectPreferences, 'suggestedIndustryTags'> {
	if (!value || typeof value !== 'object') return false;
	const preferences = value as Partial<ProjectPreferences>;
	const constraints = preferences.constraints as Partial<ProjectConstraints> | undefined;
	return (
		isStringArray(preferences.technologyTags) &&
		isStringArray(preferences.selectedIndustryTags) &&
		isStringArray(preferences.dismissedIndustryTags) &&
		preferences.suggestedIndustryTags === undefined &&
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
	return (
		value === 'welcome' ||
		value === 'problem' ||
		value === 'preferences' ||
		value === 'research' ||
		value === 'questions' ||
		value === 'concepts' ||
		value === 'focused'
	);
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

function isCompletedStageArray(value: unknown): value is CompletedStage[] {
	return (
		Array.isArray(value) &&
		value.every(
			(entry) =>
				entry === 'problem' ||
				entry === 'preferences' ||
				entry === 'research' ||
				entry === 'questions' ||
				entry === 'concepts' ||
				entry === 'focused'
		)
	);
}

function isVersionEightWorkflowStage(value: unknown): value is Exclude<WorkflowStage, 'focused'> {
	return (
		value === 'welcome' ||
		value === 'problem' ||
		value === 'preferences' ||
		value === 'research' ||
		value === 'questions' ||
		value === 'concepts'
	);
}

function isVersionEightCompletedStageArray(
	value: unknown
): value is Array<'problem' | 'preferences' | 'research' | 'questions' | 'concepts'> {
	return (
		Array.isArray(value) &&
		value.every(
			(entry) =>
				entry === 'problem' ||
				entry === 'preferences' ||
				entry === 'research' ||
				entry === 'questions' ||
				entry === 'concepts'
		)
	);
}

function isVersionSixWorkflowStage(value: unknown): value is Exclude<WorkflowStage, 'concepts'> {
	return (
		value === 'welcome' ||
		value === 'problem' ||
		value === 'preferences' ||
		value === 'research' ||
		value === 'questions'
	);
}

function isVersionSixCompletedStageArray(
	value: unknown
): value is Array<'problem' | 'preferences' | 'research' | 'questions'> {
	return (
		Array.isArray(value) &&
		value.every(
			(entry) =>
				entry === 'problem' ||
				entry === 'preferences' ||
				entry === 'research' ||
				entry === 'questions'
		)
	);
}

function isVersionFourCompletedStageArray(
	value: unknown
): value is Array<'problem' | 'preferences' | 'research'> {
	return (
		Array.isArray(value) &&
		value.every((entry) => entry === 'problem' || entry === 'preferences' || entry === 'research')
	);
}

function isLegacyIntakeStageArray(value: unknown): value is Array<'problem' | 'preferences'> {
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
