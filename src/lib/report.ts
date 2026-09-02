import type { FinalProjectPlan, FocusedResearchResult } from '$lib/finalization';
import type { InterviewAnswer, InterviewQuestion } from '$lib/interview';
import type { ProjectSession } from '$lib/project-state';
import type { BroadResearchResult } from '$lib/research';

export interface ReportSource {
	number: number;
	id: string;
	stage: 'broad' | 'focused';
	url: string;
	title: string;
	publisher: string;
	publicationDate: string | null;
	retrievedAt: string;
	evidenceSummary: string;
}

export interface ReportFinding {
	title: string;
	claim: string;
	interpretation: string | null;
	sourceNumbers: number[];
}

export interface ReportInterviewInsight {
	question: string;
	answer: string;
}

export interface ProjectReport {
	reportVersion: 1;
	projectId: string;
	generatedAt: string;
	productName: string;
	workingProjectName: string | null;
	demo: boolean;
	topic: string;
	problems: string[];
	targetUser: string;
	interviewInsights: ReportInterviewInsight[];
	constraints: Array<{ label: string; value: string }>;
	broadResearch: {
		summary: string;
		findings: ReportFinding[];
		gaps: string[];
		disclaimer: string;
	};
	focusedResearch: {
		summary: string;
		verdict: FocusedResearchResult['verdict'];
		verdictRationale: string;
		findings: ReportFinding[];
		recommendations: string[];
		gaps: string[];
		disclaimer: string;
	};
	concept: {
		pitch: string;
		description: string;
		distinctApproach: string;
	};
	plan: FinalProjectPlan;
	competitorRows: Array<{
		name: string;
		type: 'direct' | 'substitute';
		overlap: string;
		differentiation: string;
		sourceNumbers: number[];
	}>;
	riskRows: Array<{
		risk: string;
		mitigation: string;
		sourceNumbers: number[];
	}>;
	sources: ReportSource[];
}

const CONSTRAINT_LABELS: Record<string, string> = {
	targetPlatform: 'Target platform',
	deadline: 'Deadline',
	teamSize: 'Team size',
	teamSkills: 'Team skills',
	regulatory: 'Regulatory constraints',
	accessibility: 'Accessibility needs',
	existingSystems: 'Existing systems',
	revenueModel: 'Revenue model',
	other: 'Other constraints'
};

export function buildProjectReport(
	project: ProjectSession,
	now = new Date()
): ProjectReport | null {
	const plan = project.finalization.plan;
	const focused = project.finalization.research.result;
	const broad = project.research.result;
	const concept = project.concepts.portfolio?.concepts.find(
		(entry) => entry.id === plan?.selectedConceptId
	);
	if (!plan || !focused || !broad || !concept) return null;

	const sources = buildSources(broad, focused);
	const sourceNumber = (stage: ReportSource['stage'], id: string) =>
		sources.find((source) => source.stage === stage && source.id === id)?.number;
	const numbers = (stage: ReportSource['stage'], ids: string[]) =>
		ids
			.map((id) => sourceNumber(stage, id))
			.filter((number): number is number => typeof number === 'number');

	return {
		reportVersion: 1,
		projectId: project.id,
		generatedAt: now.toISOString(),
		productName: plan.productName,
		workingProjectName: project.personality.projectName.trim() || null,
		demo: project.id.startsWith('demo-'),
		topic: project.problemInput.topic.trim() || 'Untitled problem area',
		problems: project.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
		targetUser: concept.targetUser,
		interviewInsights: buildInterviewInsights(
			project.interview.questions,
			project.interview.answers
		),
		constraints: Object.entries(project.preferences.constraints)
			.filter(([, value]) => value.trim())
			.map(([key, value]) => ({ label: CONSTRAINT_LABELS[key] ?? key, value: value.trim() })),
		broadResearch: {
			summary: broad.summary,
			findings: broad.findings.map((finding) => ({
				title: finding.title,
				claim: finding.claim,
				interpretation: finding.interpretation,
				sourceNumbers: numbers('broad', finding.sourceIds)
			})),
			gaps: broad.gaps.map((gap) => `${humanize(gap.category)}: ${gap.reason}`),
			disclaimer: broad.disclaimer
		},
		focusedResearch: {
			summary: focused.summary,
			verdict: focused.verdict,
			verdictRationale: focused.verdictRationale,
			findings: focused.findings.map((finding) => ({
				title: finding.title,
				claim: finding.claim,
				interpretation: finding.interpretation,
				sourceNumbers: numbers('focused', finding.sourceIds)
			})),
			recommendations: focused.recommendations,
			gaps: focused.gaps.map((gap) => `${humanize(gap.category)}: ${gap.reason}`),
			disclaimer: focused.disclaimer
		},
		concept: {
			pitch: concept.pitch,
			description: concept.description,
			distinctApproach: concept.distinctApproach
		},
		plan,
		competitorRows: plan.competitorPositioning.map((row) => ({
			name: row.competitorName,
			type: row.type,
			overlap: row.overlap,
			differentiation: row.differentiation,
			sourceNumbers: numbers('focused', row.sourceIds)
		})),
		riskRows: plan.risks.map((row) => ({
			risk: row.risk,
			mitigation: row.mitigation,
			sourceNumbers: numbers('focused', row.evidenceSourceIds)
		})),
		sources
	};
}

export function citationLabel(numbers: number[]): string {
	return numbers.length ? numbers.map((number) => `[${number}]`).join(' ') : '';
}

export function safeReportFilename(productName: string): string {
	const slug = productName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 70);
	return `${slug || 'ideation-akinator-project'}-prd.pdf`;
}

export function parseProjectReport(value: unknown): ProjectReport | null {
	if (!isRecord(value) || value.reportVersion !== 1 || !isRecord(value.plan)) return null;
	if (
		!bounded(value.projectId, 1, 100) ||
		!isoDate(value.generatedAt) ||
		!bounded(value.productName, 1, 120) ||
		(value.workingProjectName !== null && !bounded(value.workingProjectName, 1, 120)) ||
		typeof value.demo !== 'boolean' ||
		!bounded(value.topic, 1, 200) ||
		!stringArray(value.problems, 1, 50, 2_000) ||
		!bounded(value.targetUser, 1, 500) ||
		!Array.isArray(value.sources) ||
		value.sources.length < 1 ||
		value.sources.length > 100
	)
		return null;
	// The browser builds this from already validated project state. The server still bounds the
	// complete payload and validates the fields used for filenames and document identity here.
	return value as unknown as ProjectReport;
}

function buildSources(broad: BroadResearchResult, focused: FocusedResearchResult): ReportSource[] {
	return [
		...broad.sources.map((source) => ({ ...source, stage: 'broad' as const })),
		...focused.sources.map((source) => ({ ...source, stage: 'focused' as const }))
	].map((source, index) => ({ ...source, number: index + 1 }));
}

function buildInterviewInsights(
	questions: InterviewQuestion[],
	answers: InterviewAnswer[]
): ReportInterviewInsight[] {
	return answers.map((answer) => {
		const question = questions.find((entry) => entry.id === answer.questionId);
		return {
			question: question?.prompt ?? answer.questionId,
			answer: formatAnswer(answer, question)
		};
	});
}

function formatAnswer(answer: InterviewAnswer, question?: InterviewQuestion): string {
	if (answer.status === 'skipped') return 'Skipped';
	if (answer.status === 'unknown') return 'Unknown';
	if (Array.isArray(answer.value)) {
		const labels = answer.value.map(
			(value) => question?.options.find((option) => option.id === value)?.label ?? value
		);
		return [labels.join(', '), answer.customText?.trim()].filter(Boolean).join('; ');
	}
	if (typeof answer.value === 'string')
		return question?.options.find((option) => option.id === answer.value)?.label ?? answer.value;
	if (typeof answer.value === 'boolean') return answer.value ? 'Yes' : 'No';
	if (typeof answer.value === 'number')
		return `${question?.type === 'budget' ? '$' : ''}${answer.value.toLocaleString('en-US')}${question?.unit ? ` ${question.unit}` : ''}`;
	return answer.customText?.trim() || 'No answer recorded';
}

function humanize(value: string): string {
	return value.replaceAll('-', ' ').replace(/^./, (first) => first.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bounded(value: unknown, minimum: number, maximum: number): value is string {
	return typeof value === 'string' && value.trim().length >= minimum && value.length <= maximum;
}

function isoDate(value: unknown): value is string {
	return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function stringArray(
	value: unknown,
	minimum: number,
	maximum: number,
	maximumLength: number
): value is string[] {
	return (
		Array.isArray(value) &&
		value.length >= minimum &&
		value.length <= maximum &&
		value.every((entry) => bounded(entry, 1, maximumLength))
	);
}
