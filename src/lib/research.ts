export const RESEARCH_CATEGORIES = [
	'competitors',
	'adjacent-solutions',
	'failed-products',
	'academic-work',
	'prior-art',
	'market',
	'customer-frustrations',
	'regulations-standards',
	'technical-building-blocks'
] as const;

export type ResearchCategory = (typeof RESEARCH_CATEGORIES)[number];
export type ResearchJobStatus =
	'queued' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';
export type ResearchProgress =
	'queued' | 'starting' | 'researching' | 'checking-sources' | 'retrying-structure' | 'complete';

export interface BroadResearchRequest {
	projectId: string;
	topic: string;
	problems: string[];
	technologyTags: string[];
	industryTags: string[];
	innovationLevel: 1 | 2 | 3 | 4 | 5;
	prototypeBudgetUsd: number;
	includeProductionPlanning: boolean;
	productionBudgetUsd: number | null;
	constraints: Record<string, string>;
}

export interface ResearchSource {
	id: string;
	url: string;
	title: string;
	publisher: string;
	publicationDate: string | null;
	retrievedAt: string;
	stage: 'broad';
	evidenceSummary: string;
}

export interface ResearchFinding {
	id: string;
	category: ResearchCategory;
	title: string;
	claim: string;
	interpretation: string | null;
	sourceIds: string[];
}

export interface ResearchGap {
	category: ResearchCategory;
	reason: string;
}

export interface BroadResearchResult {
	summary: string;
	findings: ResearchFinding[];
	sources: ResearchSource[];
	gaps: ResearchGap[];
	retrievedAt: string;
	disclaimer: string;
}

export interface ResearchJobView {
	id: string;
	status: ResearchJobStatus;
	progress: ResearchProgress;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
	message: string | null;
	result: BroadResearchResult | null;
	tokenUsage: number;
}

export function parseBroadResearchRequest(value: unknown): BroadResearchRequest | null {
	if (!isRecord(value)) return null;
	const problems = parseStringArray(value.problems, 1, 50, 2_000, 12_000);
	const technologyTags = parseStringArray(value.technologyTags, 1, 20, 80, 800);
	const industryTags = parseStringArray(value.industryTags, 1, 20, 80, 800);
	const constraints = parseConstraints(value.constraints);
	if (
		typeof value.projectId !== 'string' ||
		value.projectId.length < 1 ||
		value.projectId.length > 100 ||
		typeof value.topic !== 'string' ||
		value.topic.length > 120 ||
		!problems ||
		!technologyTags ||
		!industryTags ||
		!isInnovationLevel(value.innovationLevel) ||
		!isBudget(value.prototypeBudgetUsd) ||
		typeof value.includeProductionPlanning !== 'boolean' ||
		!isNullableBudget(value.productionBudgetUsd) ||
		(value.includeProductionPlanning && value.productionBudgetUsd === null) ||
		!constraints
	) {
		return null;
	}

	return {
		projectId: value.projectId,
		topic: value.topic.trim(),
		problems,
		technologyTags,
		industryTags,
		innovationLevel: value.innovationLevel,
		prototypeBudgetUsd: value.prototypeBudgetUsd,
		includeProductionPlanning: value.includeProductionPlanning,
		productionBudgetUsd: value.productionBudgetUsd,
		constraints
	};
}

export function parseResearchJobView(value: unknown): ResearchJobView | null {
	if (
		!isRecord(value) ||
		!isResearchJobStatus(value.status) ||
		!isResearchProgress(value.progress)
	) {
		return null;
	}
	if (
		typeof value.id !== 'string' ||
		!isIsoDate(value.createdAt) ||
		!isIsoDate(value.updatedAt) ||
		!isIsoDate(value.expiresAt) ||
		(value.message !== null && typeof value.message !== 'string')
	) {
		return null;
	}
	const result = value.result === null ? null : parseBroadResearchResult(value.result);
	if (value.result !== null && !result) return null;
	return {
		id: value.id,
		status: value.status,
		progress: value.progress,
		createdAt: value.createdAt,
		updatedAt: value.updatedAt,
		expiresAt: value.expiresAt,
		message: value.message,
		result,
		tokenUsage: parseTokenUsage(value.tokenUsage)
	};
}

function parseTokenUsage(value: unknown): number {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100_000_000
		? value
		: 0;
}

export function parseBroadResearchResult(value: unknown): BroadResearchResult | null {
	if (!isRecord(value)) return null;
	if (
		typeof value.summary !== 'string' ||
		value.summary.length > 2_000 ||
		!Array.isArray(value.findings) ||
		value.findings.length < 1 ||
		value.findings.length > 30 ||
		!Array.isArray(value.sources) ||
		value.sources.length < 1 ||
		value.sources.length > 50 ||
		!Array.isArray(value.gaps) ||
		value.gaps.length > RESEARCH_CATEGORIES.length ||
		!isIsoDate(value.retrievedAt) ||
		typeof value.disclaimer !== 'string'
	) {
		return null;
	}

	const sources = value.sources.map(parseSource);
	const findings = value.findings.map(parseFinding);
	const gaps = value.gaps.map(parseGap);
	if (
		sources.some((entry) => !entry) ||
		findings.some((entry) => !entry) ||
		gaps.some((entry) => !entry)
	) {
		return null;
	}
	const sourceIds = new Set((sources as ResearchSource[]).map((source) => source.id));
	if (sourceIds.size !== sources.length) return null;
	if (
		(findings as ResearchFinding[]).some((finding) =>
			finding.sourceIds.some((id) => !sourceIds.has(id))
		)
	) {
		return null;
	}

	return {
		summary: value.summary,
		findings: findings as ResearchFinding[],
		sources: sources as ResearchSource[],
		gaps: gaps as ResearchGap[],
		retrievedAt: value.retrievedAt,
		disclaimer: value.disclaimer
	};
}

export function isResearchJobStatus(value: unknown): value is ResearchJobStatus {
	return (
		value === 'queued' ||
		value === 'running' ||
		value === 'completed' ||
		value === 'partial' ||
		value === 'failed' ||
		value === 'cancelled'
	);
}

function parseSource(value: unknown): ResearchSource | null {
	if (!isRecord(value)) return null;
	const url = normalizeHttpsUrl(value.url);
	return url &&
		typeof value.id === 'string' &&
		value.id.length > 0 &&
		value.id.length <= 100 &&
		typeof value.title === 'string' &&
		value.title.length > 0 &&
		value.title.length <= 240 &&
		typeof value.publisher === 'string' &&
		value.publisher.length <= 160 &&
		(value.publicationDate === null || isSimpleDate(value.publicationDate)) &&
		isIsoDate(value.retrievedAt) &&
		value.stage === 'broad' &&
		typeof value.evidenceSummary === 'string' &&
		value.evidenceSummary.length > 0 &&
		value.evidenceSummary.length <= 500
		? {
				id: value.id,
				url,
				title: value.title,
				publisher: value.publisher,
				publicationDate: value.publicationDate,
				retrievedAt: value.retrievedAt,
				stage: 'broad',
				evidenceSummary: value.evidenceSummary
			}
		: null;
}

function parseFinding(value: unknown): ResearchFinding | null {
	if (!isRecord(value) || !isResearchCategory(value.category)) return null;
	const sourceIds = parseStringArray(value.sourceIds, 1, 5, 100, 500);
	return typeof value.id === 'string' &&
		value.id.length > 0 &&
		value.id.length <= 100 &&
		typeof value.title === 'string' &&
		value.title.length > 0 &&
		value.title.length <= 140 &&
		typeof value.claim === 'string' &&
		value.claim.length > 0 &&
		value.claim.length <= 700 &&
		(value.interpretation === null || typeof value.interpretation === 'string') &&
		(value.interpretation === null || value.interpretation.length <= 500) &&
		sourceIds
		? {
				id: value.id,
				category: value.category,
				title: value.title,
				claim: value.claim,
				interpretation: value.interpretation,
				sourceIds
			}
		: null;
}

function parseGap(value: unknown): ResearchGap | null {
	return isRecord(value) &&
		isResearchCategory(value.category) &&
		typeof value.reason === 'string' &&
		value.reason.length > 0 &&
		value.reason.length <= 300
		? { category: value.category, reason: value.reason }
		: null;
}

function parseConstraints(value: unknown): Record<string, string> | null {
	if (!isRecord(value) || Object.keys(value).length > 20) return null;
	const entries = Object.entries(value);
	if (
		entries.some(
			([key, entry]) => key.length > 80 || typeof entry !== 'string' || entry.length > 500
		)
	) {
		return null;
	}
	return Object.fromEntries(entries.map(([key, entry]) => [key, (entry as string).trim()]));
}

function parseStringArray(
	value: unknown,
	minimum: number,
	maximum: number,
	itemMaximum: number,
	totalMaximum: number
): string[] | null {
	if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return null;
	const normalized = value.map((entry) => (typeof entry === 'string' ? entry.trim() : ''));
	if (
		normalized.some((entry) => !entry || entry.length > itemMaximum) ||
		normalized.reduce((total, entry) => total + entry.length, 0) > totalMaximum
	) {
		return null;
	}
	return normalized;
}

export function normalizeHttpsUrl(value: unknown): string | null {
	if (typeof value !== 'string' || value.length > 2_048) return null;
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
		parsed.hash = '';
		return parsed.href;
	} catch {
		return null;
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isResearchCategory(value: unknown): value is ResearchCategory {
	return RESEARCH_CATEGORIES.includes(value as ResearchCategory);
}

function isResearchProgress(value: unknown): value is ResearchProgress {
	return (
		value === 'queued' ||
		value === 'starting' ||
		value === 'researching' ||
		value === 'checking-sources' ||
		value === 'retrying-structure' ||
		value === 'complete'
	);
}

function isInnovationLevel(value: unknown): value is 1 | 2 | 3 | 4 | 5 {
	return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function isBudget(value: unknown): value is number {
	return (
		typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000_000
	);
}

function isNullableBudget(value: unknown): value is number | null {
	return value === null || isBudget(value);
}

function isIsoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isSimpleDate(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		/^\d{4}-\d{2}-\d{2}$/.test(value) &&
		!Number.isNaN(Date.parse(value))
	);
}
