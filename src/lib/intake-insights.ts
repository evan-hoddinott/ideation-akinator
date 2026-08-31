export const CLARITY_LABELS = [
	'Faint signal',
	'The vision forms',
	'Strong reading',
	'Ready to summon'
] as const;

export type ClarityLabel = (typeof CLARITY_LABELS)[number];

export interface IntakeInsightsRequest {
	topic: string;
	problems: string[];
}

export interface IntakeInsights {
	clarityLabel: ClarityLabel;
	clarityReasons: string[];
	topicCoherenceWarning: string | null;
	suggestedIndustryTags: string[];
}

const MAX_TOPIC_LENGTH = 120;
const MAX_PROBLEM_LENGTH = 2_000;
const MAX_PROBLEMS = 50;
const MAX_TOTAL_PROBLEM_LENGTH = 12_000;

export function parseIntakeInsightsRequest(value: unknown): IntakeInsightsRequest | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Partial<IntakeInsightsRequest>;
	if (typeof candidate.topic !== 'string' || candidate.topic.length > MAX_TOPIC_LENGTH) return null;
	if (!Array.isArray(candidate.problems) || candidate.problems.length > MAX_PROBLEMS) return null;
	if (
		candidate.problems.some(
			(problem) => typeof problem !== 'string' || problem.length > MAX_PROBLEM_LENGTH
		)
	) {
		return null;
	}

	const topic = candidate.topic.trim();
	const problems = candidate.problems.map((problem) => problem.trim()).filter(Boolean);
	if (problems.length === 0) return null;
	if (problems.reduce((length, problem) => length + problem.length, 0) > MAX_TOTAL_PROBLEM_LENGTH) {
		return null;
	}

	return { topic, problems };
}

export function parseClarityResult(
	value: unknown
): Omit<IntakeInsights, 'suggestedIndustryTags'> | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Partial<IntakeInsights>;
	if (!isClarityLabel(candidate.clarityLabel)) return null;
	if (!isShortStringArray(candidate.clarityReasons, 1, 4, 180)) return null;
	if (
		candidate.topicCoherenceWarning !== null &&
		(typeof candidate.topicCoherenceWarning !== 'string' ||
			candidate.topicCoherenceWarning.trim().length === 0 ||
			candidate.topicCoherenceWarning.length > 240)
	) {
		return null;
	}

	return {
		clarityLabel: candidate.clarityLabel,
		clarityReasons: candidate.clarityReasons.map((reason) => reason.trim()),
		topicCoherenceWarning: candidate.topicCoherenceWarning?.trim() ?? null
	};
}

export function parseIndustryResult(
	value: unknown
): Pick<IntakeInsights, 'suggestedIndustryTags'> | null {
	if (!value || typeof value !== 'object') return null;
	const candidate = value as Partial<IntakeInsights>;
	if (!isShortStringArray(candidate.suggestedIndustryTags, 0, 5, 48)) return null;

	const suggestedIndustryTags = dedupeTags(candidate.suggestedIndustryTags);
	if (suggestedIndustryTags.some((tag) => !/^[\p{L}\p{N}& /+'-]+$/u.test(tag))) return null;
	return { suggestedIndustryTags };
}

export function parseIntakeInsights(value: unknown): IntakeInsights | null {
	const clarity = parseClarityResult(value);
	const industries = parseIndustryResult(value);
	return clarity && industries ? { ...clarity, ...industries } : null;
}

export function mergeIndustrySuggestions(
	selected: string[],
	dismissed: string[],
	previouslySuggested: string[],
	newSuggestions: string[]
): { selected: string[]; suggested: string[] } {
	const dismissedKeys = new Set(dismissed.map(tagKey));
	const selectedResult = [...selected];
	const selectedKeys = new Set(selected.map(tagKey));
	const suggestedResult = previouslySuggested.filter((tag) => selectedKeys.has(tagKey(tag)));
	const suggestedKeys = new Set(suggestedResult.map(tagKey));

	for (const tag of newSuggestions) {
		const key = tagKey(tag);
		if (dismissedKeys.has(key)) continue;
		if (!selectedKeys.has(key)) {
			selectedResult.push(tag);
			selectedKeys.add(key);
		}
		if (!suggestedKeys.has(key)) {
			suggestedResult.push(tag);
			suggestedKeys.add(key);
		}
	}

	return { selected: selectedResult, suggested: suggestedResult };
}

export function isClarityLabel(value: unknown): value is ClarityLabel {
	return typeof value === 'string' && CLARITY_LABELS.some((label) => label === value);
}

function isShortStringArray(
	value: unknown,
	minimum: number,
	maximum: number,
	maximumLength: number
): value is string[] {
	return (
		Array.isArray(value) &&
		value.length >= minimum &&
		value.length <= maximum &&
		value.every(
			(entry) =>
				typeof entry === 'string' && entry.trim().length > 0 && entry.length <= maximumLength
		)
	);
}

function dedupeTags(tags: string[]): string[] {
	const seen = new Set<string>();
	return tags
		.map((tag) => tag.trim().replace(/\s+/g, ' '))
		.filter((tag) => {
			const key = tagKey(tag);
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
}

function tagKey(tag: string): string {
	return tag.trim().toLocaleLowerCase();
}
