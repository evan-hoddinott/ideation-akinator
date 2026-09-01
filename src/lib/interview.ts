export const INTERVIEW_QUESTION_TYPES = [
	'text',
	'single-choice',
	'multiple-choice',
	'number',
	'budget',
	'yes-no'
] as const;

export type InterviewQuestionType = (typeof INTERVIEW_QUESTION_TYPES)[number];
export type InterviewAnswerStatus = 'answered' | 'skipped' | 'unknown';
export type InterviewAnswerValue = string | string[] | number | boolean | null;

export interface InterviewOption {
	id: string;
	label: string;
}

export interface InterviewQuestion {
	id: string;
	prompt: string;
	whyItMatters: string;
	type: InterviewQuestionType;
	options: InterviewOption[];
	unit: string | null;
	minimum: number | null;
	maximum: number | null;
}

export interface InterviewAnswer {
	questionId: string;
	status: InterviewAnswerStatus;
	value: InterviewAnswerValue;
	customText?: string | null;
}

export interface ProjectInterview {
	status: 'not-started' | 'active' | 'completed' | 'ended-early';
	questions: InterviewQuestion[];
	answers: InterviewAnswer[];
	currentQuestionIndex: number;
	completionReason: string | null;
	confidence: 'normal' | 'reduced';
}

export interface InterviewNextRequest {
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
	research: {
		summary: string;
		findings: Array<{ title: string; claim: string; interpretation: string | null }>;
		gaps: Array<{ category: string; reason: string }>;
	};
	questions: InterviewQuestion[];
	answers: InterviewAnswer[];
}

export type InterviewNextResult =
	| { decision: 'ask'; question: InterviewQuestion; completionReason: null }
	| { decision: 'complete'; question: null; completionReason: string };

export function createInterview(): ProjectInterview {
	return {
		status: 'not-started',
		questions: [],
		answers: [],
		currentQuestionIndex: 0,
		completionReason: null,
		confidence: 'normal'
	};
}

export function parseInterviewQuestion(value: unknown): InterviewQuestion | null {
	if (!isRecord(value)) return null;
	if (
		typeof value.id !== 'string' ||
		value.id.length < 1 ||
		value.id.length > 100 ||
		typeof value.prompt !== 'string' ||
		value.prompt.trim().length < 3 ||
		value.prompt.length > 500 ||
		typeof value.whyItMatters !== 'string' ||
		value.whyItMatters.trim().length < 3 ||
		value.whyItMatters.length > 300 ||
		!isQuestionType(value.type) ||
		!Array.isArray(value.options) ||
		(value.unit !== null && (typeof value.unit !== 'string' || value.unit.length > 40)) ||
		!isNullableFiniteNumber(value.minimum) ||
		!isNullableFiniteNumber(value.maximum)
	) {
		return null;
	}

	const options = value.options.map(parseOption);
	if (options.some((option) => !option)) return null;
	const parsedOptions = options as InterviewOption[];
	const optionIds = new Set(parsedOptions.map((option) => option.id));
	if (optionIds.size !== parsedOptions.length) return null;
	const choice = value.type === 'single-choice' || value.type === 'multiple-choice';
	const numeric = value.type === 'number' || value.type === 'budget';
	if (choice ? parsedOptions.length < 2 || parsedOptions.length > 8 : parsedOptions.length !== 0) {
		return null;
	}
	if (!numeric && (value.unit !== null || value.minimum !== null || value.maximum !== null)) {
		return null;
	}
	if (value.minimum !== null && value.maximum !== null && value.minimum > value.maximum)
		return null;

	return {
		id: value.id,
		prompt: value.prompt.trim(),
		whyItMatters: value.whyItMatters.trim(),
		type: value.type,
		options: parsedOptions,
		unit: value.unit === null ? null : value.unit.trim(),
		minimum: value.minimum,
		maximum: value.maximum
	};
}

export function parseProjectInterview(value: unknown): ProjectInterview | null {
	if (!isRecord(value) || !isInterviewStatus(value.status)) return null;
	if (
		!Array.isArray(value.questions) ||
		value.questions.length > 12 ||
		!Array.isArray(value.answers) ||
		value.answers.length > 12 ||
		!Number.isInteger(value.currentQuestionIndex) ||
		typeof value.currentQuestionIndex !== 'number' ||
		value.currentQuestionIndex < 0 ||
		(value.completionReason !== null &&
			(typeof value.completionReason !== 'string' ||
				value.completionReason.trim().length === 0 ||
				value.completionReason.length > 500)) ||
		(value.confidence !== 'normal' && value.confidence !== 'reduced')
	) {
		return null;
	}

	const questions = value.questions.map(parseInterviewQuestion);
	if (questions.some((question) => !question)) return null;
	const parsedQuestions = questions as InterviewQuestion[];
	const questionIds = new Set(parsedQuestions.map((question) => question.id));
	if (questionIds.size !== parsedQuestions.length) return null;
	if (
		parsedQuestions.length === 0
			? value.currentQuestionIndex !== 0
			: value.currentQuestionIndex >= parsedQuestions.length
	) {
		return null;
	}

	const answers = value.answers.map((answer) => parseInterviewAnswer(answer, parsedQuestions));
	if (answers.some((answer) => !answer)) return null;
	const parsedAnswers = answers as InterviewAnswer[];
	if (new Set(parsedAnswers.map((answer) => answer.questionId)).size !== parsedAnswers.length) {
		return null;
	}
	if (value.status === 'not-started' && (parsedQuestions.length > 0 || parsedAnswers.length > 0)) {
		return null;
	}
	if (value.status === 'active' && parsedQuestions.length === 0) return null;
	if (value.status === 'ended-early' && value.confidence !== 'reduced') return null;
	if (value.status !== 'ended-early' && value.confidence !== 'normal') return null;
	if (
		(value.status === 'completed' || value.status === 'ended-early') !==
		(value.completionReason !== null)
	) {
		return null;
	}

	return {
		status: value.status,
		questions: parsedQuestions,
		answers: parsedAnswers,
		currentQuestionIndex: value.currentQuestionIndex,
		completionReason: value.completionReason,
		confidence: value.confidence
	};
}

export function parseInterviewNextRequest(value: unknown): InterviewNextRequest | null {
	if (!isRecord(value)) return null;
	const problems = parseStringArray(value.problems, 1, 50, 2_000, 12_000);
	const technologyTags = parseStringArray(value.technologyTags, 1, 20, 80, 800);
	const industryTags = parseStringArray(value.industryTags, 1, 20, 80, 800);
	const constraints = parseConstraints(value.constraints);
	const research = parseResearchContext(value.research);
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
		!constraints ||
		!research ||
		!Array.isArray(value.questions) ||
		value.questions.length > 12 ||
		!Array.isArray(value.answers) ||
		value.answers.length > 12
	) {
		return null;
	}

	const questions = value.questions.map(parseInterviewQuestion);
	if (questions.some((question) => !question)) return null;
	const parsedQuestions = questions as InterviewQuestion[];
	if (new Set(parsedQuestions.map((question) => question.id)).size !== parsedQuestions.length) {
		return null;
	}
	const answers = value.answers.map((answer) => parseInterviewAnswer(answer, parsedQuestions));
	if (answers.some((answer) => !answer)) return null;
	const parsedAnswers = answers as InterviewAnswer[];
	if (new Set(parsedAnswers.map((answer) => answer.questionId)).size !== parsedAnswers.length) {
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
		constraints,
		research,
		questions: parsedQuestions,
		answers: parsedAnswers
	};
}

export function parseInterviewNextResult(value: unknown): InterviewNextResult | null {
	if (!isRecord(value)) return null;
	if (value.decision === 'complete') {
		return value.question === null &&
			typeof value.completionReason === 'string' &&
			value.completionReason.trim().length > 0 &&
			value.completionReason.length <= 500
			? {
					decision: 'complete',
					question: null,
					completionReason: value.completionReason.trim()
				}
			: null;
	}
	if (value.decision !== 'ask' || value.completionReason !== null) return null;
	const question = parseInterviewQuestion(value.question);
	return question ? { decision: 'ask', question, completionReason: null } : null;
}

export function makeInterviewAnswer(
	question: InterviewQuestion,
	status: InterviewAnswerStatus,
	value: InterviewAnswerValue,
	customText: string | null = null
): InterviewAnswer | null {
	return parseInterviewAnswer({ questionId: question.id, status, value, customText }, [question]);
}

function parseInterviewAnswer(
	value: unknown,
	questions: InterviewQuestion[]
): InterviewAnswer | null {
	if (!isRecord(value) || typeof value.questionId !== 'string' || !isAnswerStatus(value.status)) {
		return null;
	}
	const question = questions.find((entry) => entry.id === value.questionId);
	if (!question) return null;
	const customText = parseCustomText(value.customText);
	if (customText === false) return null;
	if (value.status === 'skipped' || value.status === 'unknown') {
		return value.value === null && customText === null
			? { questionId: value.questionId, status: value.status, value: null }
			: null;
	}

	if (question.type === 'text') {
		if (customText !== null) return null;
		return typeof value.value === 'string' &&
			value.value.trim().length > 0 &&
			value.value.length <= 2_000
			? { questionId: value.questionId, status: 'answered', value: value.value.trim() }
			: null;
	}
	if (question.type === 'single-choice') {
		if (customText !== null && value.value === null) {
			return {
				questionId: value.questionId,
				status: 'answered',
				value: null,
				customText
			};
		}
		return customText === null &&
			typeof value.value === 'string' &&
			question.options.some((option) => option.id === value.value)
			? { questionId: value.questionId, status: 'answered', value: value.value }
			: null;
	}
	if (question.type === 'multiple-choice') {
		if (
			!Array.isArray(value.value) ||
			(value.value.length < 1 && customText === null) ||
			value.value.some(
				(entry) =>
					typeof entry !== 'string' || !question.options.some((option) => option.id === entry)
			)
		) {
			return null;
		}
		const selected = Array.from(new Set(value.value as string[]));
		return {
			questionId: value.questionId,
			status: 'answered',
			value: selected,
			...(customText === null ? {} : { customText })
		};
	}
	if (customText !== null) return null;
	if (question.type === 'yes-no') {
		return typeof value.value === 'boolean'
			? { questionId: value.questionId, status: 'answered', value: value.value }
			: null;
	}
	if (typeof value.value !== 'number' || !Number.isFinite(value.value)) return null;
	if (question.minimum !== null && value.value < question.minimum) return null;
	if (question.maximum !== null && value.value > question.maximum) return null;
	return { questionId: value.questionId, status: 'answered', value: value.value };
}

function parseCustomText(value: unknown): string | null | false {
	if (value === undefined || value === null) return null;
	if (typeof value !== 'string' || value.length > 2_000 || value.trim().length === 0) return false;
	return value.trim();
}

function parseOption(value: unknown): InterviewOption | null {
	return isRecord(value) &&
		typeof value.id === 'string' &&
		value.id.length > 0 &&
		value.id.length <= 80 &&
		typeof value.label === 'string' &&
		value.label.trim().length > 0 &&
		value.label.length <= 160
		? { id: value.id, label: value.label.trim() }
		: null;
}

function parseResearchContext(value: unknown): InterviewNextRequest['research'] | null {
	if (!isRecord(value) || typeof value.summary !== 'string' || value.summary.length > 2_000)
		return null;
	if (!Array.isArray(value.findings) || value.findings.length > 30) return null;
	if (!Array.isArray(value.gaps) || value.gaps.length > 9) return null;
	const findings = value.findings.map((finding) => {
		if (
			!isRecord(finding) ||
			typeof finding.title !== 'string' ||
			finding.title.length > 140 ||
			typeof finding.claim !== 'string' ||
			finding.claim.length > 700 ||
			(finding.interpretation !== null &&
				(typeof finding.interpretation !== 'string' || finding.interpretation.length > 500))
		) {
			return null;
		}
		return {
			title: finding.title,
			claim: finding.claim,
			interpretation: finding.interpretation as string | null
		};
	});
	const gaps = value.gaps.map((gap) => {
		if (
			!isRecord(gap) ||
			typeof gap.category !== 'string' ||
			gap.category.length > 80 ||
			typeof gap.reason !== 'string' ||
			gap.reason.length > 500
		) {
			return null;
		}
		return { category: gap.category, reason: gap.reason };
	});
	return findings.some((finding) => !finding) || gaps.some((gap) => !gap)
		? null
		: {
				summary: value.summary,
				findings: findings as InterviewNextRequest['research']['findings'],
				gaps: gaps as InterviewNextRequest['research']['gaps']
			};
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
	entryLimit: number,
	totalLimit: number
): string[] | null {
	if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return null;
	if (value.some((entry) => typeof entry !== 'string' || entry.length > entryLimit)) return null;
	const normalized = value.map((entry) => (entry as string).trim()).filter(Boolean);
	return normalized.length >= minimum && normalized.join('').length <= totalLimit
		? normalized
		: null;
}

function isQuestionType(value: unknown): value is InterviewQuestionType {
	return INTERVIEW_QUESTION_TYPES.some((type) => type === value);
}

function isAnswerStatus(value: unknown): value is InterviewAnswerStatus {
	return value === 'answered' || value === 'skipped' || value === 'unknown';
}

function isInterviewStatus(value: unknown): value is ProjectInterview['status'] {
	return (
		value === 'not-started' ||
		value === 'active' ||
		value === 'completed' ||
		value === 'ended-early'
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

function isNullableFiniteNumber(value: unknown): value is number | null {
	return value === null || (typeof value === 'number' && Number.isFinite(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
