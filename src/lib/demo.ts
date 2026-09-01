import { COMPARISON_DIMENSIONS, type ConceptPortfolio, type ProjectConcept } from '$lib/concepts';
import type { IntakeInsights } from '$lib/intake-insights';
import type { InterviewNextResult, InterviewQuestion, ProjectInterview } from '$lib/interview';
import { createProject, type ProjectSession } from '$lib/project-state';
import type { BroadResearchResult, ResearchJobView } from '$lib/research';

const DEMO_PREFIX = 'demo-';

export const DEMO_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
	{
		id: 'demo-first-user',
		prompt: 'Who should get the first working version?',
		whyItMatters:
			'The first user decides which alerts, controls, and setup steps belong in the prototype.',
		type: 'single-choice',
		options: [
			{ id: 'students', label: 'Students who ride every day' },
			{ id: 'dispatchers', label: 'Campus transit staff' },
			{ id: 'visitors', label: 'Visitors who do not know the routes' }
		],
		unit: null,
		minimum: null,
		maximum: null
	},
	{
		id: 'demo-live-feed',
		prompt: 'Can the prototype assume access to a live vehicle feed?',
		whyItMatters: 'A live feed changes this from a notice tool into a tracking tool.',
		type: 'yes-no',
		options: [],
		unit: null,
		minimum: null,
		maximum: null
	},
	{
		id: 'demo-success',
		prompt: 'Which early result would convince you the idea works?',
		whyItMatters:
			'The chosen signal becomes the first prototype test instead of a decorative metric.',
		type: 'multiple-choice',
		options: [
			{ id: 'fewer-missed', label: 'Fewer missed buses' },
			{ id: 'faster-notices', label: 'Faster notice of route changes' },
			{ id: 'less-staff-work', label: 'Less repetitive work for staff' },
			{ id: 'better-access', label: 'More accessible stop information' }
		],
		unit: null,
		minimum: null,
		maximum: null
	}
];

export function createDemoProject(now = new Date()): ProjectSession {
	const project = createProject(now, `${DEMO_PREFIX}${createDemoId()}`);
	return {
		...project,
		stage: 'problem',
		problemInput: {
			topic: 'Campus transit confusion',
			cards: [
				{
					id: 'demo-problem-1',
					text: 'Students miss buses when temporary route changes are buried in several different campus pages.'
				},
				{
					id: 'demo-problem-2',
					text: 'Transit staff repeat the same delay updates across signs, social posts, and support messages.'
				}
			],
			clarityLabel: 'Ready to summon',
			clarityReasons: [
				'The affected users and failure are specific.',
				'Both problems concern the same campus transit information loop.'
			],
			topicCoherenceWarning: null
		},
		preferences: {
			technologyTags: ['Web app', 'Open data'],
			selectedIndustryTags: ['Higher education', 'Transportation'],
			dismissedIndustryTags: [],
			suggestedIndustryTags: ['Higher education', 'Transportation'],
			innovationLevel: 3,
			prototypeBudgetUsd: 1_500,
			includeProductionPlanning: true,
			productionBudgetUsd: 12_000,
			constraints: {
				targetPlatform: 'Desktop-first responsive web app',
				deadline: 'Eight weeks',
				teamSize: 'One student builder',
				teamSkills: 'TypeScript and basic product design',
				regulatory: 'No sensitive student records',
				accessibility: 'Keyboard navigation and readable service alerts',
				existingSystems: 'A sample GTFS feed and manual service notices',
				revenueModel: 'Internal campus tool',
				other: 'The demo must work without installing a mobile app'
			}
		},
		personality: {
			...project.personality,
			playerName: 'Demo Mortal',
			projectName: 'Campus Signal'
		}
	};
}

export function isDemoProject(project: Pick<ProjectSession, 'id'> | null | undefined): boolean {
	return project?.id.startsWith(DEMO_PREFIX) ?? false;
}

export function demoIntakeInsights(): IntakeInsights {
	return {
		clarityLabel: 'Ready to summon',
		clarityReasons: [
			'The users, setting, and consequence are concrete.',
			'The problem notes describe one shared transit information loop.'
		],
		topicCoherenceWarning: null,
		suggestedIndustryTags: ['Higher education', 'Transportation']
	};
}

export function createDemoResearchResult(now = new Date()): BroadResearchResult {
	const retrievedAt = now.toISOString();
	return {
		summary:
			'Campus riders already have general trip planners, but temporary local changes still create a narrow communication problem. A useful prototype should improve the notice loop before attempting live vehicle prediction.',
		findings: [
			{
				id: 'demo-finding-1',
				category: 'competitors',
				title: 'General transit apps cover the broad trip-planning job',
				claim:
					'Existing products already provide routes, arrivals, and service information for many agencies.',
				interpretation:
					'The demo concept needs a campus-specific workflow advantage rather than another generic map.',
				sourceIds: ['demo-source-1']
			},
			{
				id: 'demo-finding-2',
				category: 'technical-building-blocks',
				title: 'A standard feed can separate schedule data from live updates',
				claim:
					'A prototype can begin with scheduled route data and add real-time vehicle or alert data later.',
				interpretation:
					'This supports a small notice-first prototype that does not require live tracking on day one.',
				sourceIds: ['demo-source-2']
			},
			{
				id: 'demo-finding-3',
				category: 'customer-frustrations',
				title: 'The main demo risk is fragmented communication',
				claim:
					'The supplied problem notes place the failure between staff publishing a change and riders noticing it.',
				interpretation:
					'A shared publishing and alert workflow may matter more than adding another rider-only interface.',
				sourceIds: ['demo-source-3']
			}
		],
		sources: [
			{
				id: 'demo-source-1',
				url: 'https://example.com/demo/transit-apps',
				title: 'Illustrative transit product comparison',
				publisher: 'Token-free demo tape',
				publicationDate: null,
				retrievedAt,
				stage: 'broad',
				evidenceSummary: 'Canned example showing how a competitor source will appear.'
			},
			{
				id: 'demo-source-2',
				url: 'https://example.com/demo/transit-feed',
				title: 'Illustrative transit feed documentation',
				publisher: 'Token-free demo tape',
				publicationDate: null,
				retrievedAt,
				stage: 'broad',
				evidenceSummary: 'Canned example showing a technical source and its evidence summary.'
			},
			{
				id: 'demo-source-3',
				url: 'https://example.com/demo/campus-notices',
				title: 'Illustrative campus notice observations',
				publisher: 'Token-free demo tape',
				publicationDate: null,
				retrievedAt,
				stage: 'broad',
				evidenceSummary: 'Canned example derived from the supplied demo problem.'
			}
		],
		gaps: [
			{
				category: 'market',
				reason:
					'The visual demo does not perform live market research or validate willingness to pay.'
			}
		],
		retrievedAt,
		disclaimer:
			'Token-free visual demo. These are illustrative findings and sources, not live research.'
	};
}

export function createDemoResearchJob(
	status: 'running' | 'completed',
	now = new Date()
): ResearchJobView {
	const timestamp = now.toISOString();
	return {
		id: 'demo-research-job',
		status,
		progress: status === 'completed' ? 'complete' : 'researching',
		createdAt: timestamp,
		updatedAt: timestamp,
		expiresAt: new Date(now.getTime() + 60 * 60 * 1_000).toISOString(),
		message:
			status === 'completed'
				? 'The canned demo brief is ready. No web search or AI call occurred.'
				: 'Playing the local research performance. No web search or AI call is running.',
		result: status === 'completed' ? createDemoResearchResult(now) : null
	};
}

export function nextDemoInterview(interview: ProjectInterview): InterviewNextResult {
	const nextQuestion = DEMO_INTERVIEW_QUESTIONS[interview.questions.length];
	return nextQuestion
		? { decision: 'ask', question: nextQuestion, completionReason: null }
		: {
				decision: 'complete',
				question: null,
				completionReason:
					'The token-free demo has enough answers to reveal its four canned projects.'
			};
}

export function createDemoPortfolio(now = new Date(), generationNumber = 1): ConceptPortfolio {
	return {
		concepts: [
			createConcept(0, {
				name: 'Campus Signal Bell',
				pitch: 'One publishing desk turns a service change into a clear rider alert.',
				distinctApproach: 'A staff-to-rider notice pipeline built around temporary campus changes.',
				features: ['Unified service notice', 'Targeted rider alerts', 'Saved routes and stops'],
				icon: 'terminal',
				archetype: 'Helpful notification familiar'
			}),
			createConcept(1, {
				name: 'Route Steward',
				pitch: 'A tiny operations console keeps every campus transit notice consistent.',
				distinctApproach:
					'A staff-first approval and publishing workflow instead of a new rider app.',
				features: ['Staff update console', 'Notice approval queue', 'Change history'],
				icon: 'workbench',
				archetype: 'Operations familiar'
			}),
			createConcept(2, {
				name: 'Stop Beacon',
				pitch: 'Low-cost displays bring urgent route changes to the place riders wait.',
				distinctApproach: 'A physical last-yard information layer for the busiest campus stops.',
				features: ['Accessible stop display', 'Remote notice updates', 'Maintenance alerts'],
				icon: 'beacon',
				archetype: 'Sidewalk familiar'
			}),
			createConcept(3, {
				name: 'Campus Transit Twin',
				pitch: 'A simulated campus network predicts crowding before route changes go live.',
				distinctApproach:
					'A predictive planning model that tests proposed changes before publication.',
				features: ['Demand simulation', 'Route change scenarios', 'Capacity heatmap'],
				icon: 'satellite',
				archetype: 'Forbidden simulation familiar'
			})
		],
		generationNumber,
		generatedAt: now.toISOString()
	};
}

function createConcept(
	index: number,
	input: {
		name: string;
		pitch: string;
		distinctApproach: string;
		features: string[];
		icon: ProjectConcept['icon'];
		archetype: string;
	}
): ProjectConcept {
	const stretch = index === 3;
	return {
		id: `demo-concept-${index + 1}`,
		name: input.name,
		pitch: input.pitch,
		description:
			'This canned project demonstrates the structure, comparison, and feature-selection flow without asking a model to generate anything.',
		targetUser: index === 1 ? 'Campus transit coordinators' : 'Students who rely on campus transit',
		problemsAddressed: [
			'Students miss temporary route changes.',
			'Staff repeat the same update across several channels.'
		],
		distinctApproach: input.distinctApproach,
		proposedFeatures: input.features,
		highLevelRequirements: [
			'Accept a service change from an authorized staff member.',
			'Present current information in a readable and accessible format.'
		],
		implementationOutline: [
			'Prototype the core notice workflow with canned transit data.',
			'Test the workflow with a small group before adding live integrations.'
		],
		prototypeBudget: {
			minimumUsd: stretch ? 2_000 : 250 + index * 150,
			maximumUsd: stretch ? 4_500 : 800 + index * 200,
			assumptions: ['A solo student builder uses existing hardware and hosted services.']
		},
		productionBudget: {
			minimumUsd: stretch ? 18_000 : 3_000 + index * 1_000,
			maximumUsd: stretch ? 35_000 : 9_000 + index * 1_500,
			assumptions: ['The first production release supports one campus.']
		},
		prototypeTimeline: stretch ? '10 to 14 weeks' : '4 to 7 weeks',
		competitors: [
			{
				name: 'Illustrative general transit app',
				type: 'direct',
				comparison:
					'General trip planning already exists. This concept narrows its value to campus change communication.',
				sourceIds: ['demo-source-1']
			},
			{
				name: 'Email and social posts',
				type: 'substitute',
				comparison:
					'Existing channels can publish an update, but they split the workflow and do not guarantee that affected riders see it.',
				sourceIds: ['demo-source-3']
			}
		],
		mainAdvantage: input.distinctApproach,
		majorAssumptions: ['Campus transit staff will test a narrow prototype.'],
		majorRisks: ['The available transit data may be incomplete or delayed.'],
		confidence: 'medium',
		evidenceGaps: ['The canned demo does not include interviews with actual riders or staff.'],
		isStretch: stretch,
		isRecommended: index === 0,
		archetype: input.archetype,
		rarity: stretch ? 'cursed rare' : 'uncommon practical',
		icon: input.icon,
		sageReason:
			index === 0
				? 'It attacks the communication failure directly and fits the demo budget.'
				: 'It explores a meaningfully different mechanism without merging projects.',
		comparison: COMPARISON_DIMENSIONS.map((dimension) => ({
			dimension,
			rating:
				dimension === 'technical-risk'
					? stretch
						? 'high'
						: 'low'
					: dimension === 'originality'
						? stretch
							? 'high'
							: 'medium'
						: 'high',
			explanation:
				dimension === 'technical-risk'
					? stretch
						? 'Simulation and prediction create the largest technical burden.'
						: 'The first prototype can use familiar web application patterns.'
					: 'The canned inputs support this qualitative demo rating.'
		}))
	};
}

function createDemoId(): string {
	return globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36);
}
