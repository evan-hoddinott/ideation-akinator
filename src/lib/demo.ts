import { COMPARISON_DIMENSIONS, type ConceptPortfolio, type ProjectConcept } from '$lib/concepts';
import type {
	FinalProjectPlan,
	FinalRecalculationRequest,
	FocusedResearchJobView,
	FocusedResearchRequest,
	FocusedResearchResult
} from '$lib/finalization';
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

export function createDemoFocusedResearchResult(
	request: FocusedResearchRequest,
	now = new Date()
): FocusedResearchResult {
	const retrievedAt = now.toISOString();
	const sources = [
		{
			id: 'demo-focused-source-1',
			url: 'https://example.com/demo/configured-competitor',
			title: 'Illustrative configured competitor page',
			publisher: 'Token-free demo tape',
			publicationDate: null,
			retrievedAt,
			stage: 'focused' as const,
			evidenceSummary: 'Canned example showing how direct feature overlap appears.'
		},
		{
			id: 'demo-focused-source-2',
			url: 'https://example.com/demo/configured-feasibility',
			title: 'Illustrative implementation and cost notes',
			publisher: 'Token-free demo tape',
			publicationDate: null,
			retrievedAt,
			stage: 'focused' as const,
			evidenceSummary: 'Canned example showing how feasibility evidence appears.'
		}
	];
	return {
		summary: `${request.selectedConcept.name} still has a plausible campus-specific opening, but the value rests on a simpler staff-to-rider notice loop rather than generic trip planning.`,
		verdict: 'caution',
		verdictRationale:
			'The configured feature set is buildable inside the demo budget, but access to reliable campus service data remains unverified.',
		findings: [
			{
				id: 'demo-focused-finding-1',
				category: 'direct-competitors',
				title: 'Generic service alerts already exist',
				claim: 'The illustrative competitor supports general transit notices.',
				interpretation:
					'The chosen project must win on the campus publishing workflow, not on having alerts at all.',
				sourceIds: ['demo-focused-source-1']
			},
			{
				id: 'demo-focused-finding-2',
				category: 'cost-feasibility',
				title: 'The notice-first prototype stays small',
				claim: 'A web prototype can use scheduled data and manually entered service changes.',
				interpretation: 'Live prediction can remain outside the first build.',
				sourceIds: ['demo-focused-source-2']
			}
		],
		featureOverlap: request.includedFeatures.map((feature, index) => ({
			featureId: feature.id,
			status: index === 0 ? ('common' as const) : ('partial' as const),
			explanation:
				index === 0
					? `${feature.name} resembles a common transit notice capability.`
					: `${feature.name} exists in pieces, but the canned demo found no exact campus workflow match.`,
			sourceIds: ['demo-focused-source-1']
		})),
		competitorMatrix: [
			{
				name: 'Illustrative general transit app',
				type: 'direct',
				overlappingFeatures: request.includedFeatures.slice(0, 1).map((feature) => feature.name),
				missingFeatures: request.includedFeatures.slice(1).map((feature) => feature.name),
				comparison:
					'The substitute covers general rider alerts. The configured project stays narrower and gives campus staff one publishing workflow.',
				sourceIds: ['demo-focused-source-1']
			}
		],
		recommendations: [
			'Validate data access before promising live information.',
			'Test whether one publishing action actually reduces staff repetition.'
		],
		sources,
		gaps: [
			{
				category: 'regulatory-constraints',
				reason: 'The token-free walkthrough does not research a real campus or jurisdiction.'
			}
		],
		retrievedAt,
		disclaimer: 'Token-free visual demo. These are illustrative findings, not live research.'
	};
}

export function createDemoFocusedResearchJob(
	request: FocusedResearchRequest,
	status: 'running' | 'completed',
	now = new Date()
): FocusedResearchJobView {
	const timestamp = now.toISOString();
	return {
		id: 'demo-focused-research-job',
		status,
		progress: status === 'completed' ? 'complete' : 'researching',
		createdAt: timestamp,
		updatedAt: timestamp,
		expiresAt: new Date(now.getTime() + 60 * 60 * 1_000).toISOString(),
		message:
			status === 'completed'
				? 'The canned configured-project brief is ready. No web search occurred.'
				: 'Playing the local focused research performance. No AI call is running.',
		result: status === 'completed' ? createDemoFocusedResearchResult(request, now) : null
	};
}

export function createDemoFinalPlan(
	request: FinalRecalculationRequest,
	now = new Date()
): FinalProjectPlan {
	const features = request.includedFeatures;
	return {
		selectedConceptId: request.selectedConcept.id,
		productName: request.selectedConcept.name,
		oneLineSummary:
			'A campus notice desk that turns one staff update into clear information for affected riders.',
		executiveSummary:
			'This recalculated demo plan keeps the confirmed notice workflow small. It tests staff publishing and rider comprehension before adding live tracking or prediction.',
		confirmedFeatures: features,
		prototypeBudget: {
			minimumUsd: 450,
			maximumUsd: 1_200,
			assumptions: [
				'One student builds the prototype with hosted web services.',
				'The first test uses sample transit data and manual notices.'
			]
		},
		productionBudget: request.includeProductionPlanning
			? {
					minimumUsd: 4_000,
					maximumUsd: 10_000,
					assumptions: ['One campus deploys the service with a maintained data feed.']
				}
			: null,
		prototypeTimeline: '5 to 7 weeks',
		functionalRequirements: features.map((feature, index) => ({
			id: `FR-${index + 1}`,
			name: feature.name,
			description: feature.description,
			acceptanceCriteria: [`A test user can complete the ${feature.name} workflow.`]
		})),
		nonfunctionalRequirements: [
			{
				category: 'Accessibility',
				requirement: 'Current service notices must remain readable without color or animation.',
				measure: 'Keyboard-only review passes and every notice has text status.'
			},
			{
				category: 'Freshness',
				requirement: 'Published changes must appear promptly.',
				measure: 'A saved test notice appears within 30 seconds.'
			}
		],
		technologyRecommendations: [
			{
				area: 'Application',
				choice: 'TypeScript web app with a small relational database',
				rationale:
					'It matches the demo builder skills and keeps the publishing workflow inspectable.'
			}
		],
		hardwareManufacturingRequirements: [],
		featureDependencies: features.map((feature) => ({
			featureId: feature.id,
			dependsOnFeatureIds: feature.dependencies,
			explanation: feature.dependencies.length
				? 'Keep the confirmed workshop dependency.'
				: 'This feature has no confirmed dependency.'
		})),
		technicalDifficulty: 'medium',
		technicalDifficultyRationale:
			'The interface is routine, but reliable transit data and timely publishing need early testing.',
		competitorPositioning: [
			{
				competitorName: 'Illustrative general transit app',
				type: 'direct',
				overlap: 'Both present service alerts to riders.',
				differentiation: 'The selected project centers the campus staff publishing loop.',
				sourceIds: ['demo-focused-source-1']
			}
		],
		risks: [
			{
				risk: 'Campus data access may be delayed or unavailable.',
				mitigation:
					'Prototype with scheduled data and manual notices before integrating a live feed.',
				evidenceSourceIds: ['demo-focused-source-2']
			}
		],
		validationSteps: [
			{
				hypothesis: 'One publishing action reduces repeated staff updates.',
				method: 'Run a tabletop route-change exercise with two staff members.',
				successSignal: 'Both publish the complete notice without copying it into another tool.'
			}
		],
		developmentPhases: [
			{
				name: 'Notice loop prototype',
				goal: 'Prove the staff-to-rider workflow.',
				deliverables: ['Staff notice form', 'Rider notice page', 'Sample campus route data']
			},
			{
				name: 'Small campus test',
				goal: 'Measure comprehension and staff effort.',
				deliverables: ['Usability notes', 'Timing measurements', 'Revised requirements']
			}
		],
		materialWarning: null,
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
