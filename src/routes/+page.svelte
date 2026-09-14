<script lang="ts">
	import '$lib/workflow.css';
	import TagPicker from '$lib/components/TagPicker.svelte';
	import BudgetMeter from '$lib/components/BudgetMeter.svelte';
	import type { WorkstationView } from '$lib/workstation-3d';
	import { resolve } from '$app/paths';
	import ConceptRoom from '$lib/components/ConceptRoom.svelte';
	import ChaosLayer from '$lib/components/ChaosLayer.svelte';
	import FinalizationRoom from '$lib/components/FinalizationRoom.svelte';
	import LoginTerminal from '$lib/components/LoginTerminal.svelte';
	import MainMenu from '$lib/components/MainMenu.svelte';
	import ResearchWorkstation from '$lib/components/ResearchWorkstation.svelte';
	import ResearchBrief from '$lib/components/ResearchBrief.svelte';
	import SageDialogue from '$lib/components/SageDialogue.svelte';
	import SageBanter from '$lib/components/SageBanter.svelte';
	import SageStage from '$lib/components/SageStage.svelte';
	import VerticalWorld from '$lib/components/VerticalWorld.svelte';
	import { OracleAudio, type OracleEffect } from '$lib/oracle-audio';
	import {
		createConceptState,
		parseConceptGenerationResult,
		type ConceptGenerationRequest,
		type RejectedConceptSummary
	} from '$lib/concepts';
	import {
		createDemoPortfolio,
		createDemoProject,
		createDemoResultsProject,
		DEMO_INTERVIEW_QUESTIONS,
		createDemoFinalPlan,
		createDemoFocusedResearchJob,
		createDemoResearchJob,
		demoIntakeInsights,
		isDemoProject,
		nextDemoInterview
	} from '$lib/demo';
	import {
		focusedRequestFingerprint,
		finalizationConflicts,
		nextFinalizationAction
	} from '$lib/finalization-flow';
	import {
		createProjectFinalization,
		parseFinalProjectPlan,
		parseFocusedResearchJobView,
		type FinalRecalculationRequest,
		type FocusedResearchJobView,
		type FocusedResearchRequest,
		type SelectedConceptInput,
		type SelectedFeatureInput
	} from '$lib/finalization';
	import {
		createFeatureWorkshop,
		featurePlacement,
		type FeatureWorkshopState
	} from '$lib/feature-workshop';
	import {
		CLARITY_LABELS,
		mergeIndustrySuggestions,
		parseIntakeInsights,
		type IntakeInsights,
		type IntakeInsightsRequest
	} from '$lib/intake-insights';
	import { clearChaosRun } from '$lib/interruptions';
	import {
		createInterview,
		makeInterviewAnswer,
		parseNumericAnswerDraft,
		parseInterviewNextResult,
		type InterviewAnswer,
		type InterviewAnswerStatus,
		type InterviewNextResult,
		type InterviewNextRequest,
		type InterviewQuestion
	} from '$lib/interview';
	import {
		reactToSageEvent,
		type SageContext,
		type SageEvent,
		type SageSoundCue
	} from '$lib/personality';
	import {
		clearProject,
		createProject,
		createProblemCard,
		loadProject,
		saveProject,
		type InnovationLevel,
		type ProjectConstraints,
		type ProjectSession
	} from '$lib/project-state';
	import { buildProjectReport, safeReportFilename } from '$lib/report';
	import type { SageVoiceProfile } from '$lib/rpg-dialogue';
	import { clearTokenUsage, recordResponseTokenUsage, recordTokenUsage } from '$lib/token-usage';
	import { DEMO_RESEARCH_DURATION_MS, startVisibleTimer } from '$lib/research-performance';
	import { INTERNET_ERAS } from '$lib/internet-era';
	import { projectSceneryAltitude } from '$lib/era-journey';
	import { projectAltitude, type SageClip, type SageScreenAnchors } from '$lib/sage-stage';
	import {
		RESEARCH_CATEGORIES,
		parseResearchJobView,
		type BroadResearchRequest,
		type ResearchCategory,
		type ResearchJobView,
		type ResearchSource
	} from '$lib/research';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { data, form } = $props();
	let project = $state<ProjectSession | null>(null);
	let stateReady = $state(false);
	let stateNotice = $state('');
	let submitting = $state(false);
	let resetDialog = $state<HTMLDialogElement>();
	let technologyTagDraft = $state('');
	let industryTagDraft = $state('');
	let preferenceError = $state('');
	let preferencesSealed = $state(false);
	let insightStatus = $state<'idle' | 'waiting' | 'loading' | 'ready' | 'error' | 'unavailable'>(
		'idle'
	);
	let insightMessage = $state('');
	let insightRetryNonce = $state(0);
	let insightRequestSequence = 0;
	let completedInsightSignature = '';
	let researchBusy = $state(false);
	let researchMessage = $state('');
	let interviewBusy = $state(false);
	let interviewMessage = $state('');
	let interviewDialog = $state<HTMLDialogElement>();
	let conceptBusy = $state(false);
	let conceptMessage = $state('');
	let focusedResearchBusy = $state(false);
	let focusedStartSequence = 0;
	let finalPlanBusy = $state(false);
	let finalPlanController: AbortController | null = null;
	let finalizationMessage = $state('');
	let pdfBusy = $state(false);
	let pdfMessage = $state('');
	let textAnswer = $state('');
	let numberAnswer = $state('');
	let singleAnswer = $state('');
	let multipleAnswer = $state<string[]>([]);
	let yesNoAnswer = $state<boolean | null>(null);
	let customAnswer = $state('');
	let customAnswerOpen = $state(false);
	let loadedAnswerSignature = '';
	let playerNameDraft = $state('');
	let projectNameDraft = $state('');
	let activeProblemId = $state('');
	let answerConfirming = $state(false);
	let confirmedAnswer = $state('');
	let broadResearchPerformanceOpen = $state(false);
	let broadResearchSkipped = $state(false);
	let preferenceStep = $state(0);
	let pauseMenuOpen = $state(false);
	let sageSpeaking = $state(false);
	let banterSpeaking = $state(false);
	let sageVoicePulse = $state(0);
	let sageVoiceEnergy = $state(0.5);
	let sagePerformance = $state<SageClip | null>(null);
	let sageModelFallback = $state(false);
	let workstationView = $state<WorkstationView | null>(null);
	let sageAnchors = $state<SageScreenAnchors | null>(null);
	let previewMuted = $state(true);
	let previewCalm = $state(false);
	let resetWorldSignal = $state(0);
	let mainMenuOpen = $state(true);
	let resetIntent = $state<'menu' | 'new' | 'demo'>('menu');
	let presentationDebugMode = $state<
		'off' | 'clips' | 'workstation' | 'popup' | 'world' | 'mail' | 'scroll' | 'history' | 'results'
	>('off');
	let debugAltitude = $state<number | null>(null);
	let debugResearchHold = $state(false);
	let historyObjectOpen = $state(false);
	let presentationDebugReady = false;
	let oracleAudio: OracleAudio | null = null;
	let reducedMotionApplied = false;
	const stagePreview = createProject(new Date(0), 'stage-preview');
	const visualProject = $derived(
		project ?? {
			...stagePreview,
			personality: {
				...stagePreview.personality,
				muted: previewMuted,
				calmMode: previewCalm
			}
		}
	);
	const demoMode = $derived(isDemoProject(project));
	const sceneryAltitude = $derived(
		debugAltitude ?? (project ? projectSceneryAltitude(project) : 0.5 / 14)
	);
	const sageAltitude = $derived(debugAltitude ?? (project ? projectAltitude(project) : 0.04));
	let sceneryEraIndex = $state(0);
	const worldEra = $derived(INTERNET_ERAS[sceneryEraIndex]);
	const worldEraIndex = $derived(sceneryEraIndex);
	const finalReport = $derived(project ? buildProjectReport(project) : null);

	const insightSignature = $derived(
		project
			? JSON.stringify({
					topic: project.problemInput.topic,
					problems: project.problemInput.cards
						.map((card) => card.text)
						.filter((text) => text.trim())
				})
			: ''
	);
	const clarityPosition = $derived(
		project?.problemInput.clarityLabel
			? CLARITY_LABELS.indexOf(project.problemInput.clarityLabel) + 1
			: 0
	);
	const broadResearchIsActive = $derived(
		project?.research.status === 'queued' || project?.research.status === 'running'
	);
	const focusedResearchIsActive = $derived(
		project?.finalization.research.status === 'queued' ||
			project?.finalization.research.status === 'running'
	);
	const researchIsActive = $derived(broadResearchIsActive || focusedResearchIsActive);
	const finalPrintActive = $derived.by(() => {
		if (
			!project ||
			project.stage !== 'focused' ||
			!project.finalization.plan ||
			project.finalization.printPresented
		)
			return false;
		const input = focusedResearchRequest(project);
		return !!input && finalizationConflicts(input, project.finalization).length === 0;
	});
	const currentQuestion = $derived(
		project?.interview.questions[project.interview.currentQuestionIndex] ?? null
	);
	const currentAnswer = $derived(
		currentQuestion
			? (project?.interview.answers.find((answer) => answer.questionId === currentQuestion.id) ??
					null)
			: null
	);
	const answeredQuestionCount = $derived(project?.interview.answers.length ?? 0);
	const activeProblemCard = $derived(
		project?.problemInput.cards.find((card) => card.id === activeProblemId) ??
			project?.problemInput.cards.at(-1) ??
			null
	);
	const filledProblemCount = $derived(
		project?.problemInput.cards.filter((card) => card.text.trim()).length ?? 0
	);
	const researchSourceCount = $derived(project?.research.result?.sources.length ?? 0);

	const sageDebugClips: SageClip[] = [
		'idle',
		'talk',
		'attentive',
		'reaction',
		'thinking',
		'approval',
		'confusion',
		'suspicious',
		'shocked',
		'weak_answer',
		'smug',
		'lie',
		'chair_wobble',
		'ascend',
		'drop',
		'popup_notice',
		'popup_swat',
		'workstation_exit',
		'workstation_push',
		'workstation_park',
		'workstation_turn',
		'research_typing',
		'research_one_hand',
		'research_inspect',
		'research_smack',
		'research_cable',
		'research_sleep',
		'research_celebrate',
		'research_complete',
		'scroll_present',
		'mail_notice',
		'mail_click',
		'reveal',
		'defeat',
		'forbidden'
	];

	const innovationLabels = [
		'Proven and conventional',
		'Familiar with a small twist',
		'Meaningfully different',
		'Experimental',
		'Wild but buildable today'
	];
	const researchCategoryLabels: Record<ResearchCategory, string> = {
		competitors: 'Direct competitors',
		'adjacent-solutions': 'Adjacent solutions',
		'failed-products': 'Failed or discontinued products',
		'academic-work': 'Academic work',
		'prior-art': 'Patents and prior art',
		market: 'Market signals',
		'customer-frustrations': 'Customer frustrations',
		'regulations-standards': 'Regulations and standards',
		'technical-building-blocks': 'Technical building blocks'
	};
	const constraintFields: Array<{
		key: keyof ProjectConstraints;
		label: string;
		placeholder: string;
		wide?: boolean;
	}> = [
		{
			key: 'targetPlatform',
			label: 'Target platform',
			placeholder: 'Web, mobile, physical device...'
		},
		{ key: 'deadline', label: 'Deadline', placeholder: 'No deadline, 3 months...' },
		{ key: 'teamSize', label: 'Team size', placeholder: 'Solo, 3 people...' },
		{ key: 'teamSkills', label: 'Team skills', placeholder: 'CAD, Python, electronics...' },
		{
			key: 'regulatory',
			label: 'Regulatory constraints',
			placeholder: 'HIPAA, food safety, none known',
			wide: true
		},
		{
			key: 'accessibility',
			label: 'Accessibility needs',
			placeholder: 'Screen reader support, one-handed use...',
			wide: true
		},
		{
			key: 'existingSystems',
			label: 'Existing systems or data',
			placeholder: 'APIs, spreadsheets, equipment...',
			wide: true
		},
		{
			key: 'revenueModel',
			label: 'Preferred revenue model',
			placeholder: 'One-time purchase, subscription, open source...'
		},
		{
			key: 'other',
			label: 'Other constraints',
			placeholder: 'Anything else the ideas must respect',
			wide: true
		}
	];

	$effect(() => {
		if (!data.authenticated || stateReady) return;

		const result = loadProject(window.localStorage);
		project = result.project;
		if (project?.finalization.planStatus === 'running' && !project.finalization.plan) {
			project = saveProject(window.localStorage, {
				...project,
				finalization: { ...project.finalization, planStatus: 'failed' }
			});
			finalizationMessage =
				'Plan generation was interrupted. Your completed research is saved. Retry the plan when ready.';
		}
		playerNameDraft = result.project?.personality.playerName ?? '';
		projectNameDraft = result.project?.personality.projectName ?? '';
		stateReady = true;

		if (result.status === 'recovered') {
			stateNotice = 'An unreadable old project was cleared. Nothing else in this browser changed.';
		} else if (result.status === 'migrated') {
			stateNotice = 'Your saved project was upgraded and restored in this browser.';
		} else if (result.status === 'ready') {
			stateNotice = 'Your unfinished project was restored from this browser.';
		}
	});

	$effect(() => {
		if (!stateReady || presentationDebugReady) return;
		presentationDebugReady = true;
		const requestedMode = new URL(window.location.href).searchParams.get('sageDebug');
		if (
			requestedMode !== 'clips' &&
			requestedMode !== 'workstation' &&
			requestedMode !== 'popup' &&
			requestedMode !== 'world' &&
			requestedMode !== 'mail' &&
			requestedMode !== 'scroll' &&
			requestedMode !== 'history' &&
			requestedMode !== 'results'
		)
			return;
		presentationDebugMode = requestedMode;
		mainMenuOpen = false;
		if (requestedMode === 'results') {
			project = createDemoResultsProject();
			if (import.meta.env.DEV && new URL(window.location.href).searchParams.has('print'))
				project.finalization.printPresented = false;
			stateNotice = '';
			return;
		}
		if (requestedMode === 'popup') {
			const debugProject = createDemoProject();
			debugProject.stage = 'problem';
			debugProject.personality.achievements = [];
			project = debugProject;
			return;
		}
		if (requestedMode === 'world') {
			const debugProject = createDemoProject();
			debugProject.stage = 'problem';
			project = debugProject;
			const debugUrl = new URL(window.location.href);
			const requestedEra = Number(debugUrl.searchParams.get('era') ?? '0');
			const eraIndex = Math.max(0, Math.min(13, Math.floor(requestedEra)));
			debugAltitude = (eraIndex + 0.5) / 14;
			if (debugUrl.searchParams.has('climb')) {
				debugAltitude = 0.025;
				for (let step = 1; step <= 22; step += 1) {
					window.setTimeout(() => (debugAltitude = 0.025 + step * 0.026), step * 620);
				}
			}
			if (debugUrl.searchParams.has('reset')) {
				window.setTimeout(() => (resetWorldSignal += 1), 1_800);
			}
			return;
		}
		if (requestedMode === 'scroll') {
			const debugProject = createDemoProject();
			debugProject.stage = 'research';
			const debugResearch = createDemoResearchJob('completed');
			debugProject.research = {
				jobId: debugResearch.id,
				status: debugResearch.status,
				result: debugResearch.result
			};
			project = debugProject;
			broadResearchPerformanceOpen = false;
			return;
		}
		if (requestedMode === 'mail') {
			if (import.meta.env.DEV && new URL(window.location.href).searchParams.has('perform')) {
				const debugProject = createDemoResultsProject();
				debugProject.stage = 'concepts';
				debugProject.concepts = { status: 'idle', portfolio: null };
				debugProject.finalization = createProjectFinalization();
				project = debugProject;
				return;
			}
			const debugProject = createDemoProject();
			const portfolio = createDemoPortfolio();
			for (const key of Object.keys(window.localStorage)) {
				if (key.startsWith('ideation-akinator:concept-mail:')) window.localStorage.removeItem(key);
			}
			debugProject.stage = 'concepts';
			debugProject.concepts.portfolio = portfolio;
			debugProject.featureWorkshop = createFeatureWorkshop(portfolio);
			project = debugProject;
			return;
		}
		if (requestedMode === 'history') {
			const debugProject = createDemoProject();
			debugProject.stage = 'questions';
			debugProject.interview = {
				status: 'active',
				questions: DEMO_INTERVIEW_QUESTIONS,
				answers: [
					{ questionId: 'demo-first-user', status: 'answered', value: 'students' },
					{ questionId: 'demo-live-feed', status: 'answered', value: false }
				],
				currentQuestionIndex: 2,
				completionReason: null,
				confidence: 'normal'
			};
			project = debugProject;
			window.setTimeout(previousInterviewQuestion, 900);
			return;
		}
		if (requestedMode !== 'workstation') return;
		const debugProject = createDemoProject();
		debugProject.stage = 'research';
		const workstationDebugUrl = new URL(window.location.href);
		debugResearchHold = workstationDebugUrl.searchParams.has('hold');
		if (workstationDebugUrl.searchParams.has('handoff')) {
			const debugResearch = createDemoResearchJob('completed');
			debugProject.research = {
				jobId: debugResearch.id,
				status: debugResearch.status,
				result: debugResearch.result
			};
		} else {
			debugProject.research.status = 'running';
			debugProject.research.jobId = 'demo-presentation-workstation';
			debugProject.research.result = null;
		}
		project = debugProject;
		broadResearchPerformanceOpen = true;
	});

	$effect(() => {
		if (!stateReady || reducedMotionApplied || !project) return;
		reducedMotionApplied = true;
		if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		if (project.personality.calmMode) return;
		project = saveProject(window.localStorage, {
			...project,
			personality: { ...project.personality, calmMode: true }
		});
	});

	$effect(() => {
		oracleAudio?.setEra(worldEraIndex);
	});

	$effect(() => {
		if (!stateReady) return;
		const onVisibility = () => {
			if (!oracleAudio || visualProject.personality.muted) return;
			void oracleAudio.setEnabled(document.visibilityState === 'visible');
		};
		document.addEventListener('visibilitychange', onVisibility);
		return () => document.removeEventListener('visibilitychange', onVisibility);
	});

	$effect(() => {
		const signature = insightSignature;
		const retryNonce = insightRetryNonce;
		if (
			!stateReady ||
			!signature ||
			project?.stage === 'research' ||
			project?.stage === 'questions' ||
			project?.stage === 'concepts' ||
			project?.stage === 'focused'
		)
			return;

		const input = JSON.parse(signature) as IntakeInsightsRequest;
		if (input.problems.length === 0) {
			insightStatus = 'idle';
			insightMessage = '';
			return;
		}
		if (signature === completedInsightSignature && project?.problemInput.clarityLabel) return;

		void retryNonce;
		insightStatus = 'waiting';
		insightMessage = 'Listening for a pause...';
		const controller = new AbortController();
		const sequence = ++insightRequestSequence;
		const timer = window.setTimeout(() => {
			void requestIntakeInsights(input, signature, sequence, controller.signal);
		}, 900);

		return () => {
			window.clearTimeout(timer);
			controller.abort();
		};
	});

	$effect(() => {
		const jobId = project?.stage === 'research' ? project.research.jobId : null;
		const status = project?.research.status;
		if (!jobId || (status !== 'queued' && status !== 'running')) return;
		if (isDemoProject(project)) {
			if (presentationDebugMode === 'workstation' && debugResearchHold) return;
			return startVisibleTimer(DEMO_RESEARCH_DURATION_MS.broad, () => completeDemoResearch(jobId));
		}

		const timer = window.setInterval(() => void pollResearchJob(jobId), 1_500);
		return () => window.clearInterval(timer);
	});

	$effect(() => {
		const jobId = project?.stage === 'focused' ? project.finalization.research.jobId : null;
		const status = project?.finalization.research.status;
		if (!jobId || (status !== 'queued' && status !== 'running')) return;
		if (isDemoProject(project)) {
			return startVisibleTimer(DEMO_RESEARCH_DURATION_MS.focused, () =>
				completeDemoFocusedResearch(jobId)
			);
		}
		const timer = window.setInterval(() => void pollFocusedResearchJob(jobId), 1_500);
		return () => window.clearInterval(timer);
	});

	$effect(() => {
		const question = currentQuestion;
		const answer = currentAnswer;
		const signature = question ? `${question.id}:${JSON.stringify(answer)}` : '';
		if (signature === loadedAnswerSignature) return;
		loadedAnswerSignature = signature;
		textAnswer = question?.type === 'text' && typeof answer?.value === 'string' ? answer.value : '';
		numberAnswer =
			(question?.type === 'number' || question?.type === 'budget') &&
			typeof answer?.value === 'number'
				? String(answer.value)
				: '';
		singleAnswer =
			question?.type === 'single-choice' && typeof answer?.value === 'string' ? answer.value : '';
		multipleAnswer =
			question?.type === 'multiple-choice' && Array.isArray(answer?.value) ? [...answer.value] : [];
		yesNoAnswer =
			question?.type === 'yes-no' && typeof answer?.value === 'boolean' ? answer.value : null;
		customAnswer = answer?.customText ?? '';
		customAnswerOpen = !!answer?.customText;
	});

	const enhanceLogin: SubmitFunction = () => {
		submitting = true;
		window.sessionStorage.setItem('ideation-akinator:login-attempted', '1');
		return async ({ update }) => {
			await update();
			submitting = false;
		};
	};

	function beginProject() {
		const nextProject = project ?? createProject();
		const namedProject = {
			...nextProject,
			stage: 'problem' as const,
			personality: {
				...nextProject.personality,
				muted: project ? nextProject.personality.muted : previewMuted,
				calmMode: project ? nextProject.personality.calmMode : previewCalm,
				playerName: playerNameDraft.trim().slice(0, 50),
				projectName: projectNameDraft.trim().slice(0, 50)
			}
		};
		const reaction = reactToSageEvent(
			namedProject.personality,
			'project-started',
			namedProject.id,
			sageContext(namedProject)
		);
		project = saveProject(window.localStorage, {
			...namedProject,
			personality: reaction.personality
		});
		resumeRunAudio();
		playSageCue(reaction.sound);
		stateNotice = 'Project started. Your progress now stays in this browser.';
	}

	function beginDemo() {
		const createdDemo = createDemoProject();
		const demo = {
			...createdDemo,
			personality: {
				...createdDemo.personality,
				muted: previewMuted,
				calmMode: previewCalm
			}
		};
		const reaction = reactToSageEvent(
			demo.personality,
			'project-started',
			demo.id,
			sageContext(demo)
		);
		project = saveProject(window.localStorage, {
			...demo,
			personality: reaction.personality
		});
		playerNameDraft = demo.personality.playerName;
		projectNameDraft = demo.personality.projectName;
		insightStatus = 'ready';
		insightMessage = 'Canned demo reading. No model call occurred.';
		completedInsightSignature = insightSignature;
		stateNotice = 'Token-free visual demo. Every research result, question, and idea is canned.';
		resumeRunAudio();
		playSageCue(reaction.sound);
	}

	function restartDemo() {
		if (!demoMode) return;
		startOver();
		beginDemo();
	}

	function resumeRunAudio() {
		if (!project || project.personality.muted) return;
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		void oracleAudio.setEnabled(true);
	}

	function continueFromMenu() {
		mainMenuOpen = false;
		resumeRunAudio();
	}

	function newFromMenu() {
		if (project) startOver();
		mainMenuOpen = false;
		beginProject();
	}

	function demoFromMenu() {
		if (project) startOver();
		mainMenuOpen = false;
		beginDemo();
	}

	function requestStartOver() {
		resetIntent = 'menu';
		resetDialog?.showModal();
	}

	function confirmStartOver() {
		const intent = resetIntent;
		startOver();
		if (intent === 'menu') mainMenuOpen = true;
		if (intent === 'new') mainMenuOpen = false;
		if (intent === 'demo') {
			mainMenuOpen = false;
			beginDemo();
		}
	}

	function sageContext(session: ProjectSession): SageContext {
		return {
			playerName: session.personality.playerName,
			projectName: session.personality.projectName,
			topic: session.problemInput.topic,
			industries: session.preferences.selectedIndustryTags,
			technologies: session.preferences.technologyTags,
			problemCount: session.problemInput.cards.filter((card) => card.text.trim()).length,
			answeredCount: session.interview.answers.length,
			hasResearch: !!session.research.result
		};
	}

	function performSageEvent(
		event: SageEvent,
		session: ProjectSession | null = project,
		context: SageContext = {}
	) {
		if (!session) return;
		const reaction = reactToSageEvent(session.personality, event, session.id, {
			...sageContext(session),
			...context
		});
		project = saveProject(window.localStorage, { ...session, personality: reaction.personality });
		playSageCue(reaction.sound);
	}

	function grantAchievement(achievement: string) {
		if (!project || project.personality.achievements.includes(achievement)) return;
		project = saveProject(window.localStorage, {
			...project,
			personality: {
				...project.personality,
				achievements: [...project.personality.achievements, achievement]
			}
		});
	}

	function playSageCue(cue: SageSoundCue) {
		if (!project || project.personality.muted) return;
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		oracleAudio.playCue(cue);
	}

	function playOracleEffect(effect: OracleEffect, volume?: number) {
		if (visualProject.personality.muted || visualProject.personality.calmMode) return;
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		oracleAudio.playEffect(effect, volume);
	}

	function playSageVoice(profile: SageVoiceProfile) {
		sageVoicePulse += 1;
		sageVoiceEnergy = Math.min(1, Math.max(0.15, profile.volume / 0.05));
		if (visualProject.personality.muted) return;
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		oracleAudio.playVoice(profile);
	}

	function setSageSpeaking(speaking: boolean) {
		sageSpeaking = speaking;
	}

	function toggleSageAudio() {
		if (!project) {
			previewMuted = !previewMuted;
			oracleAudio ??= new OracleAudio();
			oracleAudio.setEra(worldEraIndex);
			void oracleAudio.setEnabled(!previewMuted);
			if (!previewMuted) oracleAudio.playCue('reveal');
			return;
		}
		const muted = !project.personality.muted;
		project = saveProject(window.localStorage, {
			...project,
			personality: { ...project.personality, muted }
		});
		oracleAudio ??= new OracleAudio();
		oracleAudio.setEra(worldEraIndex);
		void oracleAudio.setEnabled(!muted);
		if (!muted) oracleAudio.playCue('reveal');
	}

	function toggleCalmMode() {
		if (!project) {
			previewCalm = !previewCalm;
			if (previewCalm) {
				previewMuted = true;
				void oracleAudio?.setEnabled(false);
			}
			return;
		}
		const calmMode = !project.personality.calmMode;
		const nextProject = {
			...project,
			personality: {
				...project.personality,
				calmMode,
				muted: calmMode ? true : project.personality.muted
			}
		};
		if (calmMode) void oracleAudio?.setEnabled(false);
		performSageEvent(calmMode ? 'calm-enabled' : 'calm-disabled', nextProject);
	}

	function findForbiddenFloppy() {
		performSageEvent('secret-found');
	}

	function togglePauseMenu() {
		pauseMenuOpen = !pauseMenuOpen;
	}

	function handleAppKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('dialog[open]')) return;
		event.preventDefault();
		togglePauseMenu();
	}

	function persist(nextProject: ProjectSession) {
		const invalidatesResearch =
			project && intakeFingerprint(project) !== intakeFingerprint(nextProject);
		project = saveProject(
			window.localStorage,
			invalidatesResearch
				? {
						...nextProject,
						research: { jobId: null, status: 'idle', result: null },
						interview: createInterview(),
						concepts: createConceptState(),
						featureWorkshop: createFeatureWorkshop(null),
						finalization: createProjectFinalization(),
						completedStages: nextProject.completedStages.filter(
							(stage) =>
								stage !== 'research' &&
								stage !== 'questions' &&
								stage !== 'concepts' &&
								stage !== 'focused'
						)
					}
				: nextProject
		);
		preferencesSealed = false;
	}

	function recordApiUsage(response: Response) {
		if (!project) return;
		recordResponseTokenUsage(window.localStorage, project.id, response);
	}

	function persistResearch(job: ResearchJobView) {
		if (!project) return;
		recordTokenUsage(window.localStorage, project.id, `research:${job.id}`, job.tokenUsage);
		const previousStatus = project.research.status;
		if (
			(job.status === 'completed' || job.status === 'partial') &&
			(previousStatus === 'queued' || previousStatus === 'running') &&
			!broadResearchSkipped
		) {
			broadResearchPerformanceOpen = true;
		}
		project = saveProject(window.localStorage, {
			...project,
			completedStages:
				job.status === 'completed' || job.status === 'partial'
					? Array.from(new Set([...project.completedStages, 'research']))
					: project.completedStages.filter((stage) => stage !== 'research'),
			research: { jobId: job.id, status: job.status, result: job.result }
		});
		researchMessage = job.message ?? progressMessage(job);
		if (job.status !== previousStatus) {
			if (job.status === 'completed' || job.status === 'partial') {
				performSageEvent('research-complete', project);
			} else if (job.status === 'failed' || job.status === 'cancelled') {
				performSageEvent('research-failed', project);
			} else if (job.status === 'running') {
				performSageEvent('research-progress', project);
			}
		}
	}

	function setTopic(topic: string) {
		if (!project) return;
		persist({
			...project,
			problemInput: clearProblemReading({ ...project.problemInput, topic })
		});
	}

	function setProblemText(id: string, text: string) {
		if (!project) return;
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: project.problemInput.cards.map((card) => (card.id === id ? { ...card, text } : card))
			}
		});
	}

	function addProblem() {
		if (!project) return;
		const card = createProblemCard();
		activeProblemId = card.id;
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: [...project.problemInput.cards, card]
			}
		});
		performSageEvent('problem-added', project);
	}

	function removeProblem(id: string) {
		if (!project) return;
		const cards = project.problemInput.cards.filter((card) => card.id !== id);
		persist({
			...project,
			problemInput: {
				...clearProblemReading(project.problemInput),
				cards: cards.length > 0 ? cards : [createProblemCard()]
			}
		});
		performSageEvent('problem-removed', project);
	}

	function moveProblem(index: number, direction: -1 | 1) {
		if (!project) return;
		const target = index + direction;
		if (target < 0 || target >= project.problemInput.cards.length) return;
		const cards = [...project.problemInput.cards];
		[cards[index], cards[target]] = [cards[target], cards[index]];
		persist({
			...project,
			problemInput: { ...clearProblemReading(project.problemInput), cards }
		});
	}

	function clearProblemReading(problemInput: ProjectSession['problemInput']) {
		return {
			...problemInput,
			clarityLabel: null,
			clarityReasons: [],
			topicCoherenceWarning: null
		};
	}

	async function requestIntakeInsights(
		input: IntakeInsightsRequest,
		signature: string,
		sequence: number,
		signal: AbortSignal
	) {
		insightStatus = 'loading';
		insightMessage = isDemoProject(project)
			? 'Playing a canned clarity reading...'
			: 'Reading the signal...';
		try {
			if (isDemoProject(project)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 180));
				if (signal.aborted) return;
				applyIntakeInsights(demoIntakeInsights(), signature, sequence);
				return;
			}
			const response = await fetch(resolve('/api/intake-insights'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input),
				signal
			});
			recordApiUsage(response);
			const body: unknown = await response.json();
			if (!response.ok) {
				const errorBody = body as { message?: unknown };
				insightStatus = response.status === 503 ? 'unavailable' : 'error';
				insightMessage =
					typeof errorBody.message === 'string'
						? errorBody.message
						: 'The reading flickered out. Your notes are still saved.';
				return;
			}

			const insights = parseIntakeInsights(body);
			if (!insights) throw new Error('Invalid intake insight response');
			applyIntakeInsights(insights, signature, sequence);
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			if (sequence !== insightRequestSequence) return;
			insightStatus = 'error';
			insightMessage = 'The reading flickered out. Your notes are safe, and you can try again.';
		}
	}

	function applyIntakeInsights(insights: IntakeInsights, signature: string, sequence: number) {
		if (sequence !== insightRequestSequence || signature !== insightSignature || !project) return;
		completedInsightSignature = signature;

		const mergedIndustries = mergeIndustrySuggestions(
			project.preferences.selectedIndustryTags,
			project.preferences.dismissedIndustryTags,
			project.preferences.suggestedIndustryTags,
			insights.suggestedIndustryTags
		);
		const previousClarity = project.problemInput.clarityLabel;
		const previousIndustryCount = project.preferences.selectedIndustryTags.length;
		persist({
			...project,
			problemInput: {
				...project.problemInput,
				clarityLabel: insights.clarityLabel,
				clarityReasons: insights.clarityReasons,
				topicCoherenceWarning: insights.topicCoherenceWarning
			},
			preferences: {
				...project.preferences,
				selectedIndustryTags: mergedIndustries.selected,
				suggestedIndustryTags: mergedIndustries.suggested,
				suggestedTechnologyTags:
					insights.suggestedTechnologyTags ?? project.preferences.suggestedTechnologyTags ?? []
			}
		});
		if (project && mergedIndustries.selected.length > previousIndustryCount) {
			performSageEvent('industries-guessed', project);
		} else if (project && insights.clarityLabel !== previousClarity) {
			const strong = CLARITY_LABELS.indexOf(insights.clarityLabel) >= 3;
			performSageEvent(strong ? 'clarity-strong' : 'clarity-weak', project);
		}
		insightStatus = 'ready';
		insightMessage = isDemoProject(project)
			? 'Canned demo reading. No model call occurred.'
			: 'Reading updated.';
	}

	function retryIntakeInsights() {
		completedInsightSignature = '';
		insightRetryNonce += 1;
	}

	function goToPreferences() {
		if (!project) return;
		if (filledProblemCount === 0) {
			stateNotice = 'The Sage needs at least one actual problem before setting limitations.';
			return;
		}
		persist({
			...project,
			stage: 'preferences',
			completedStages: Array.from(new Set([...project.completedStages, 'problem']))
		});
		stateNotice = 'Problem notes saved. Preferences are up next.';
		preferenceStep = 0;
		performSageEvent('preferences-opened', project);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function goToProblem() {
		if (!project) return;
		persist({ ...project, stage: 'problem' });
		preferenceError = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function nextPreferenceStep() {
		if (!project) return;
		if (
			!project.preferences.technologyTags.length ||
			!project.preferences.selectedIndustryTags.length
		) {
			preferenceError =
				'Choose a technology preference and at least one research topic. Open to anything is a valid preference.';
			return;
		}
		preferenceError = '';
		preferenceStep = 1;
	}

	function previousPreferenceStep() {
		if (preferenceStep === 0) {
			goToProblem();
			return;
		}
		preferenceError = '';
		preferenceStep -= 1;
	}

	function addTag(kind: 'technology' | 'industry', value?: string) {
		if (!project) return;
		const draft = value ?? (kind === 'technology' ? technologyTagDraft : industryTagDraft);
		const tag = draft.trim().replace(/\s+/g, ' ');
		if (!tag) return;
		const key = kind === 'technology' ? 'technologyTags' : 'selectedIndustryTags';
		const current = project.preferences[key];
		if (!current.some((entry) => entry.toLocaleLowerCase() === tag.toLocaleLowerCase())) {
			persist({
				...project,
				preferences: {
					...project.preferences,
					[key]: [...current, tag],
					dismissedIndustryTags:
						kind === 'industry'
							? project.preferences.dismissedIndustryTags.filter(
									(entry) => entry.toLocaleLowerCase() !== tag.toLocaleLowerCase()
								)
							: project.preferences.dismissedIndustryTags,
					suggestedIndustryTags:
						kind === 'industry'
							? project.preferences.suggestedIndustryTags.filter(
									(entry) => entry.toLocaleLowerCase() !== tag.toLocaleLowerCase()
								)
							: project.preferences.suggestedIndustryTags
				}
			});
		}
		if (kind === 'technology') technologyTagDraft = '';
		else industryTagDraft = '';
		preferenceError = '';
	}

	function tagKeydown(event: KeyboardEvent, kind: 'technology' | 'industry') {
		if (event.key !== 'Enter' && event.key !== ',') return;
		event.preventDefault();
		addTag(kind);
	}

	function removeTag(kind: 'technology' | 'industry', tag: string) {
		if (!project) return;
		if (kind === 'technology') {
			persist({
				...project,
				preferences: {
					...project.preferences,
					technologyTags: project.preferences.technologyTags.filter((entry) => entry !== tag),
					dismissedTechnologyTags: Array.from(
						new Set([...(project.preferences.dismissedTechnologyTags ?? []), tag])
					)
				}
			});
			return;
		}
		persist({
			...project,
			preferences: {
				...project.preferences,
				selectedIndustryTags: project.preferences.selectedIndustryTags.filter(
					(entry) => entry !== tag
				),
				dismissedIndustryTags: Array.from(
					new Set([...project.preferences.dismissedIndustryTags, tag])
				),
				suggestedIndustryTags: project.preferences.suggestedIndustryTags.filter(
					(entry) => entry !== tag
				)
			}
		});
	}

	function setInnovationLevel(level: number) {
		if (!project) return;
		persist({
			...project,
			preferences: { ...project.preferences, innovationLevel: level as InnovationLevel }
		});
		if (level === 1) performSageEvent('innovation-safe', project);
		if (level === 5) performSageEvent('innovation-wild', project);
	}

	function updateBudget(kind: 'prototype' | 'production', value: number | null) {
		if (
			!project ||
			(value !== null && (!Number.isFinite(value) || value < 0 || value > 1_000_000_000))
		)
			return;
		persist({
			...project,
			preferences: {
				...project.preferences,
				[kind === 'prototype' ? 'prototypeBudgetUsd' : 'productionBudgetUsd']: value
			}
		});
		preferenceError = '';
	}

	function setBudget(kind: 'prototype' | 'production', input: HTMLInputElement) {
		if (!project) return;
		const value = input.value === '' ? null : Math.max(0, input.valueAsNumber);
		persist({
			...project,
			preferences: {
				...project.preferences,
				[kind === 'prototype' ? 'prototypeBudgetUsd' : 'productionBudgetUsd']: value
			}
		});
		preferenceError = '';
	}

	function setProductionPlanning(includeProductionPlanning: boolean) {
		if (!project) return;
		persist({
			...project,
			preferences: { ...project.preferences, includeProductionPlanning }
		});
		preferenceError = '';
	}

	function setConstraint(key: keyof ProjectConstraints, value: string) {
		if (!project) return;
		persist({
			...project,
			preferences: {
				...project.preferences,
				constraints: { ...project.preferences.constraints, [key]: value }
			}
		});
	}

	function sealPreferences() {
		if (!project) return;
		const preferences = project.preferences;
		if (preferences.technologyTags.length === 0) {
			preferenceError = 'Add a technology preference. "Open to anything" is a valid answer.';
			return;
		}
		if (preferences.selectedIndustryTags.length === 0) {
			preferenceError = 'Add at least one industry. The Sage can suggest them from your problems.';
			return;
		}
		if (preferences.prototypeBudgetUsd === null) {
			preferenceError = 'Enter the total prototype budget. Zero is allowed.';
			return;
		}
		if (preferences.includeProductionPlanning && preferences.productionBudgetUsd === null) {
			preferenceError = 'Enter a production budget, or turn off production planning.';
			return;
		}

		project = saveProject(window.localStorage, {
			...project,
			stage: 'research',
			completedStages: Array.from(new Set([...project.completedStages, 'preferences']))
		});
		preferenceError = '';
		preferencesSealed = false;
		stateNotice = 'Project brief saved. Researching your problems.';
		void startBroadResearch();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function startBroadResearch() {
		if (!project || researchBusy || broadResearchIsActive) return;
		const input = broadResearchRequest(project);
		if (!input) {
			researchMessage = 'The intake is missing a required budget or preference.';
			return;
		}

		researchBusy = true;
		broadResearchPerformanceOpen = true;
		broadResearchSkipped = false;
		researchMessage = 'Opening the research room...';
		project = saveProject(window.localStorage, {
			...project,
			interview: createInterview(),
			concepts: createConceptState(),
			featureWorkshop: createFeatureWorkshop(null),
			finalization: createProjectFinalization(),
			completedStages: project.completedStages.filter(
				(stage) =>
					stage !== 'research' &&
					stage !== 'questions' &&
					stage !== 'concepts' &&
					stage !== 'focused'
			)
		});
		performSageEvent('research-started', project);
		if (isDemoProject(project)) {
			persistResearch(createDemoResearchJob('running'));
			researchBusy = false;
			return;
		}
		try {
			const response = await fetch(resolve('/api/research/jobs'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});
			const body: unknown = await response.json();
			if (!response.ok) {
				const error = body as { message?: unknown };
				researchMessage =
					typeof error.message === 'string'
						? error.message
						: 'Research could not start. Your intake is still saved.';
				return;
			}
			const job = parseResearchJobView(body);
			if (!job) throw new Error('Invalid research job response');
			persistResearch(job);
		} catch {
			researchMessage = 'Research could not start. Your intake is still saved.';
		} finally {
			researchBusy = false;
		}
	}

	function completeDemoResearch(jobId: string) {
		if (
			!project ||
			!isDemoProject(project) ||
			project.research.jobId !== jobId ||
			(project.research.status !== 'queued' && project.research.status !== 'running')
		) {
			return;
		}
		persistResearch(createDemoResearchJob('completed'));
	}

	function skipBroadResearchPerformance() {
		if (!project) return;
		broadResearchSkipped = true;
		broadResearchPerformanceOpen = false;
		performSageEvent('answer-skipped', project);
		const jobId = project.research.jobId;
		if (jobId && isDemoProject(project)) completeDemoResearch(jobId);
	}

	function skipFocusedResearchPerformance() {
		if (!project) return;
		performSageEvent('answer-skipped', project);
		const jobId = project.finalization.research.jobId;
		if (jobId && isDemoProject(project)) completeDemoFocusedResearch(jobId);
	}

	async function pollResearchJob(jobId: string) {
		try {
			const response = await fetch(`/api/research/jobs/${encodeURIComponent(jobId)}`);
			const body: unknown = await response.json();
			if (!response.ok) {
				if (response.status === 404 && project?.research.jobId === jobId) {
					project = saveProject(window.localStorage, {
						...project,
						research: { jobId: null, status: 'failed', result: project.research.result }
					});
				}
				const error = body as { message?: unknown };
				researchMessage =
					typeof error.message === 'string'
						? error.message
						: 'The research job could not be restored.';
				return;
			}
			const job = parseResearchJobView(body);
			if (!job || project?.research.jobId !== jobId) return;
			persistResearch(job);
		} catch {
			researchMessage =
				'The status check failed. The app will keep trying while this page is open.';
		}
	}

	async function cancelResearchJob(silent = false) {
		const jobId = project?.research.jobId;
		if (!jobId || !broadResearchIsActive) return;
		if (project && isDemoProject(project)) {
			project = saveProject(window.localStorage, {
				...project,
				research: { jobId: null, status: 'cancelled', result: null }
			});
			researchMessage = silent ? '' : 'The local demo performance was cancelled.';
			return;
		}
		if (!silent) researchMessage = 'Cancelling the research pass...';
		try {
			const response = await fetch(`/api/research/jobs/${encodeURIComponent(jobId)}`, {
				method: 'DELETE'
			});
			const body: unknown = await response.json();
			const job = parseResearchJobView(body);
			if (response.ok && job && project?.research.jobId === jobId) persistResearch(job);
		} catch {
			if (!silent)
				researchMessage = 'The cancel request failed. Check the job status before retrying.';
		}
	}

	function retryBroadResearch() {
		if (!project) return;
		project = saveProject(window.localStorage, {
			...project,
			research: { jobId: null, status: 'idle', result: project.research.result }
		});
		researchMessage = '';
		void startBroadResearch();
	}

	function broadResearchRequest(session: ProjectSession): BroadResearchRequest | null {
		const preferences = session.preferences;
		if (
			preferences.prototypeBudgetUsd === null ||
			(preferences.includeProductionPlanning && preferences.productionBudgetUsd === null)
		) {
			return null;
		}
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			technologyTags: preferences.technologyTags,
			industryTags: preferences.selectedIndustryTags,
			innovationLevel: preferences.innovationLevel,
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			constraints: { ...preferences.constraints }
		};
	}

	function intakeFingerprint(session: ProjectSession) {
		return JSON.stringify(broadResearchRequest(session));
	}

	function progressMessage(job: ResearchJobView): string {
		return {
			queued: 'Waiting for a research slot...',
			starting: 'Opening the dusty web...',
			researching: 'Checking what people built, tried, and complained about...',
			'checking-sources': 'Checking every source before it reaches the brief...',
			'retrying-structure': 'The sources arrived messy. Sorting them once more...',
			complete: 'The broad research brief is ready.'
		}[job.progress];
	}

	function sourceFor(id: string): ResearchSource | undefined {
		return project?.research.result?.sources.find((source) => source.id === id);
	}

	function goToResearch() {
		if (!project || interviewBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'research' });
		interviewMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function enterInterview() {
		if (!project || !project.research.result || interviewBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'questions' });
		stateNotice = 'Research saved. The Sage will ask one useful question at a time.';
		performSageEvent('interview-started', project);
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (project.interview.questions.length === 0) void requestNextInterview(project);
	}

	async function requestNextInterview(session: ProjectSession | null = project) {
		if (!session || interviewBusy) return;
		const input = interviewRequest(session);
		if (!input) {
			interviewMessage = 'The saved research or budget is incomplete. Return to the research room.';
			return;
		}
		interviewBusy = true;
		interviewMessage = isDemoProject(session)
			? 'The Sage is consulting his local demo cue cards...'
			: 'The Sage is choosing the next useful question...';
		try {
			let result: InterviewNextResult | null;
			if (isDemoProject(session)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 280));
				result = nextDemoInterview(session.interview);
			} else {
				const response = await fetch(resolve('/api/interview/next'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(input)
				});
				recordApiUsage(response);
				const body: unknown = await response.json();
				if (!response.ok) {
					const error = body as { message?: unknown };
					interviewMessage =
						typeof error.message === 'string'
							? error.message
							: 'The next question did not arrive. Your answers are still saved.';
					return;
				}
				result = parseInterviewNextResult(body);
			}
			if (!result || !project || project.id !== session.id) {
				throw new Error('Invalid interview response');
			}
			if (result.decision === 'complete') {
				project = saveProject(window.localStorage, {
					...project,
					completedStages: Array.from(new Set([...project.completedStages, 'questions'])),
					interview: {
						...project.interview,
						status: 'completed',
						completionReason: result.completionReason,
						confidence: 'normal'
					}
				});
				interviewMessage = '';
				performSageEvent('interview-finished', project);
				return;
			}
			project = saveProject(window.localStorage, {
				...project,
				interview: {
					...project.interview,
					status: 'active',
					questions: [...project.interview.questions, result.question],
					currentQuestionIndex: project.interview.questions.length,
					completionReason: null
				}
			});
			interviewMessage = '';
		} catch {
			interviewMessage =
				'The next question did not arrive. Your answers are saved, and you can retry.';
		} finally {
			interviewBusy = false;
		}
	}

	function interviewRequest(session: ProjectSession): InterviewNextRequest | null {
		const research = session.research.result;
		const preferences = session.preferences;
		if (!research || preferences.prototypeBudgetUsd === null) return null;
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			technologyTags: preferences.technologyTags,
			industryTags: preferences.selectedIndustryTags,
			innovationLevel: preferences.innovationLevel,
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			constraints: { ...preferences.constraints },
			research: {
				summary: research.summary,
				findings: research.findings.map(({ title, claim, interpretation }) => ({
					title,
					claim,
					interpretation
				})),
				gaps: research.gaps.map(({ category, reason }) => ({ category, reason }))
			},
			questions: session.interview.questions,
			answers: session.interview.answers
		};
	}

	async function submitInterviewAnswer(
		status: InterviewAnswerStatus,
		immediateValue?: InterviewAnswer['value']
	) {
		if (!project || !currentQuestion || interviewBusy || answerConfirming) return;
		const answer = makeInterviewAnswer(
			currentQuestion,
			status,
			status === 'answered'
				? immediateValue === undefined
					? draftAnswerValue(currentQuestion)
					: immediateValue
				: null,
			status === 'answered' && customAnswerOpen ? customAnswer : null
		);
		if (!answer) {
			interviewMessage = 'Choose or enter an answer first, or use Skip or I don’t know.';
			return;
		}

		const questionId = currentQuestion.id;
		const projectId = project.id;
		answerConfirming = true;
		confirmedAnswer = JSON.stringify(answer.value);
		await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 360));
		if (
			project?.id !== projectId ||
			project.stage !== 'questions' ||
			currentQuestion?.id !== questionId
		) {
			answerConfirming = false;
			return;
		}
		const index = project.interview.currentQuestionIndex;
		const existing = project.interview.answers.find(
			(entry) => entry.questionId === currentQuestion.id
		);
		if (
			existing &&
			JSON.stringify(existing) === JSON.stringify(answer) &&
			index < project.interview.questions.length - 1
		) {
			project = saveProject(window.localStorage, {
				...project,
				interview: { ...project.interview, currentQuestionIndex: index + 1 }
			});
			interviewMessage = '';
			answerConfirming = false;
			return;
		}

		const keptQuestions = project.interview.questions.slice(0, index + 1);
		const keptIds = new Set(keptQuestions.map((question) => question.id));
		const answers = project.interview.answers.filter(
			(entry) => entry.questionId !== currentQuestion.id && keptIds.has(entry.questionId)
		);
		const nextProject = saveProject(window.localStorage, {
			...project,
			completedStages: project.completedStages.filter(
				(stage) => stage !== 'questions' && stage !== 'concepts' && stage !== 'focused'
			),
			concepts: createConceptState(),
			featureWorkshop: createFeatureWorkshop(null),
			finalization: createProjectFinalization(),
			interview: {
				...project.interview,
				status: 'active',
				questions: keptQuestions,
				answers: [...answers, answer],
				currentQuestionIndex: index,
				completionReason: null,
				confidence: 'normal'
			}
		});
		project = nextProject;
		performSageEvent(
			existing
				? 'answer-changed'
				: status === 'skipped'
					? 'answer-skipped'
					: status === 'unknown'
						? 'answer-unknown'
						: 'answer-saved',
			project
		);
		interviewMessage = '';
		try {
			await requestNextInterview(project);
		} finally {
			answerConfirming = false;
			confirmedAnswer = '';
		}
	}

	function draftAnswerValue(question: InterviewQuestion): InterviewAnswer['value'] {
		if (question.type === 'text') return textAnswer;
		if (question.type === 'single-choice') return customAnswerOpen ? null : singleAnswer;
		if (question.type === 'multiple-choice') return multipleAnswer;
		if (question.type === 'yes-no') return yesNoAnswer;
		return parseNumericAnswerDraft(numberAnswer);
	}

	function toggleMultipleAnswer(id: string, checked: boolean) {
		multipleAnswer = checked
			? Array.from(new Set([...multipleAnswer, id]))
			: multipleAnswer.filter((entry) => entry !== id);
	}

	function openCustomAnswer() {
		customAnswerOpen = true;
		singleAnswer = '';
	}

	function previousInterviewQuestion() {
		if (!project || interviewBusy || project.interview.currentQuestionIndex === 0) return;
		if (historyObjectOpen) return;
		historyObjectOpen = true;
		sagePerformance = 'thinking';
		playOracleEffect('sage-thinking', 0.25);
		window.setTimeout(
			() => {
				historyObjectOpen = false;
				sagePerformance = null;
				commitPreviousInterviewQuestion();
			},
			presentationDebugMode === 'history' ? 15_000 : project.personality.calmMode ? 0 : 720
		);
	}

	function commitPreviousInterviewQuestion() {
		if (!project || project.interview.currentQuestionIndex === 0) return;
		project = saveProject(window.localStorage, {
			...project,
			interview: {
				...project.interview,
				currentQuestionIndex: project.interview.currentQuestionIndex - 1
			}
		});
		interviewMessage = '';
		performSageEvent('question-revisited', project);
	}

	function finishInterviewEarly() {
		if (!project) return;
		project = saveProject(window.localStorage, {
			...project,
			completedStages: Array.from(new Set([...project.completedStages, 'questions'])),
			concepts: createConceptState(),
			featureWorkshop: createFeatureWorkshop(null),
			finalization: createProjectFinalization(),
			interview: {
				...project.interview,
				status: 'ended-early',
				completionReason: 'The interview ended early at your request.',
				confidence: 'reduced'
			}
		});
		interviewMessage = '';
		performSageEvent('interview-abandoned', project);
		interviewDialog?.close();
	}

	function enterConceptRoom() {
		if (
			!project ||
			conceptBusy ||
			(project.interview.status !== 'completed' && project.interview.status !== 'ended-early')
		)
			return;
		project = saveProject(window.localStorage, { ...project, stage: 'concepts' });
		conceptMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
		if (!project.concepts.portfolio) void requestConcepts(false);
	}

	function returnToQuestions() {
		if (!project || conceptBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'questions' });
		conceptMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function conceptRequest(
		session: ProjectSession,
		rejectedConcepts: RejectedConceptSummary[] = []
	): ConceptGenerationRequest | null {
		const research = session.research.result;
		const preferences = session.preferences;
		if (
			!research ||
			preferences.prototypeBudgetUsd === null ||
			(preferences.includeProductionPlanning && preferences.productionBudgetUsd === null) ||
			(session.interview.status !== 'completed' && session.interview.status !== 'ended-early')
		) {
			return null;
		}
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			technologyTags: preferences.technologyTags,
			industryTags: preferences.selectedIndustryTags,
			innovationLevel: preferences.innovationLevel,
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			constraints: { ...preferences.constraints },
			research,
			interview: session.interview,
			rejectedConcepts
		};
	}

	async function requestConcepts(replacement: boolean) {
		if (!project || conceptBusy) return;
		const oldPortfolio = project.concepts.portfolio;
		const rejectedConcepts =
			replacement && oldPortfolio
				? oldPortfolio.concepts.map(({ name, pitch, distinctApproach }) => ({
						name,
						pitch,
						distinctApproach
					}))
				: [];
		const input = conceptRequest(project, rejectedConcepts);
		if (!input) {
			conceptMessage = 'The saved research, interview, or budget is incomplete.';
			return;
		}

		conceptBusy = true;
		conceptMessage = replacement
			? 'The Sage is deleting four prophecies and pretending this is normal...'
			: 'The Sage is assembling four meaningfully different futures...';
		performSageEvent(replacement ? 'sage-defeated' : 'concept-summoning', project);
		const projectId = project.id;
		try {
			if (isDemoProject(project)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 850));
				if (!project || project.id !== projectId) return;
				const portfolio = createDemoPortfolio(
					new Date(),
					(oldPortfolio?.generationNumber ?? 0) + 1
				);
				project = saveProject(window.localStorage, {
					...project,
					stage: 'concepts',
					completedStages: Array.from(new Set([...project.completedStages, 'concepts'])),
					concepts: { status: 'ready', portfolio },
					featureWorkshop: createFeatureWorkshop(portfolio),
					finalization: createProjectFinalization()
				});
				conceptMessage = '';
				performSageEvent('concept-revealed', project);
				window.scrollTo({ top: 0, behavior: 'smooth' });
				return;
			}
			const response = await fetch(resolve('/api/concepts'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});
			recordApiUsage(response);
			const body: unknown = await response.json();
			if (!response.ok) {
				const error = body as { message?: unknown };
				conceptMessage =
					typeof error.message === 'string'
						? error.message
						: 'The four futures did not stabilize. Your earlier work is still saved.';
				return;
			}
			const result = parseConceptGenerationResult(body, input);
			if (!result || !project || project.id !== projectId) throw new Error('Invalid portfolio');
			const portfolio = {
				...result,
				generationNumber: (oldPortfolio?.generationNumber ?? 0) + 1,
				generatedAt: new Date().toISOString()
			};
			project = saveProject(window.localStorage, {
				...project,
				stage: 'concepts',
				completedStages: Array.from(new Set([...project.completedStages, 'concepts'])),
				concepts: {
					status: 'ready',
					portfolio
				},
				featureWorkshop: createFeatureWorkshop(portfolio),
				finalization: createProjectFinalization()
			});
			conceptMessage = '';
			performSageEvent('concept-revealed', project);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch {
			conceptMessage = 'The four futures did not stabilize. Your earlier work is still saved.';
		} finally {
			conceptBusy = false;
		}
	}

	function reactToConceptReveal() {
		performSageEvent('concept-revealed');
	}

	function reactToAllConcepts() {
		performSageEvent('concepts-complete');
	}

	function updateFeatureWorkshop(
		next: FeatureWorkshopState,
		event: 'changed' | 'blocked' | 'confirmed'
	) {
		if (!project) return;
		if (event !== 'blocked') {
			const candidate = { ...project, featureWorkshop: next };
			const input = focusedResearchRequest(candidate);
			const fingerprint = input ? focusedRequestFingerprint(input) : null;
			project = saveProject(window.localStorage, {
				...candidate,
				completedStages: candidate.completedStages.filter((stage) => stage !== 'focused'),
				finalization:
					fingerprint && fingerprint === project.finalization.configurationFingerprint
						? project.finalization
						: createProjectFinalization()
			});
		}
		performSageEvent(
			event === 'confirmed'
				? 'project-selected'
				: event === 'blocked'
					? 'feature-blocked'
					: 'feature-changed',
			project
		);
	}

	function focusedResearchRequest(session: ProjectSession): FocusedResearchRequest | null {
		const selectedConceptId = session.featureWorkshop.selectedConceptId;
		const concept = session.concepts.portfolio?.concepts.find(
			(candidate) => candidate.id === selectedConceptId
		);
		const configuration = session.featureWorkshop.configurations.find(
			(candidate) => candidate.conceptId === selectedConceptId
		);
		const broadResearch = session.research.result;
		const preferences = session.preferences;
		if (
			session.featureWorkshop.status !== 'confirmed' ||
			!concept ||
			!configuration ||
			!broadResearch ||
			preferences.prototypeBudgetUsd === null ||
			(preferences.includeProductionPlanning && preferences.productionBudgetUsd === null)
		)
			return null;

		const included = configuration.features.filter((feature) => feature.included);
		const includedIds = new Set(included.map((feature) => feature.id));
		if (!included.length) return null;
		const selectedConcept: SelectedConceptInput = {
			id: concept.id,
			isStretch: concept.isStretch,
			name: concept.name,
			pitch: concept.pitch,
			description: concept.description,
			targetUser: concept.targetUser,
			distinctApproach: concept.distinctApproach,
			prototypeBudget: concept.prototypeBudget,
			productionBudget: concept.productionBudget,
			prototypeTimeline: concept.prototypeTimeline
		};
		const includedFeatures: SelectedFeatureInput[] = included.map((feature) => ({
			id: feature.id,
			name: feature.name,
			description: feature.description,
			tier: feature.tier,
			dependencies: feature.dependencies.filter((id) => includedIds.has(id))
		}));
		return {
			projectId: session.id,
			topic: session.problemInput.topic,
			problems: session.problemInput.cards.map((card) => card.text.trim()).filter(Boolean),
			selectedConcept,
			includedFeatures,
			deferredFeatures: configuration.features
				.filter((feature) => featurePlacement(feature) === 'later')
				.map(({ id, name, description }) => ({ id, name, description })),
			constraints: { ...preferences.constraints },
			prototypeBudgetUsd: preferences.prototypeBudgetUsd,
			includeProductionPlanning: preferences.includeProductionPlanning,
			productionBudgetUsd: preferences.productionBudgetUsd,
			broadResearch
		};
	}

	function enterFinalizationRoom() {
		if (!project) return;
		stateNotice = '';
		const input = focusedResearchRequest(project);
		if (!input) {
			conceptMessage = 'Seal one project with at least one feature before focused research.';
			return;
		}
		const fingerprint = focusedRequestFingerprint(input);
		project = saveProject(window.localStorage, {
			...project,
			stage: 'focused',
			finalization:
				project.finalization.configurationFingerprint === fingerprint
					? project.finalization
					: { ...createProjectFinalization(), configurationFingerprint: fingerprint }
		});
		finalizationMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	$effect(() => {
		if (!project || project.stage !== 'focused' || focusedResearchBusy || finalPlanBusy) return;
		const input = focusedResearchRequest(project);
		if (!input) return;
		const action = nextFinalizationAction(input, project.finalization);
		if (action === 'research') void startFocusedResearch();
		if (action === 'plan') void generateFinalPlan();
	});

	function currentFocusedRequestMatches(projectId: string, fingerprint: string) {
		if (!project || project.id !== projectId || project.stage !== 'focused') return false;
		const current = focusedResearchRequest(project);
		return (
			!!current &&
			focusedRequestFingerprint(current) === fingerprint &&
			project.finalization.configurationFingerprint === fingerprint
		);
	}

	function finishFinalPrint() {
		if (!project || !project.finalization.plan) return;
		const input = focusedResearchRequest(project);
		if (!input || finalizationConflicts(input, project.finalization).length) return;
		project = saveProject(window.localStorage, {
			...project,
			finalization: { ...project.finalization, printPresented: true }
		});
	}

	function returnToWorkshop() {
		if (!project || focusedResearchIsActive || finalPlanBusy) return;
		project = saveProject(window.localStorage, { ...project, stage: 'concepts' });
		finalizationMessage = '';
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function persistFocusedResearchJob(job: FocusedResearchJobView) {
		if (!project) return;
		recordTokenUsage(window.localStorage, project.id, `focused:${job.id}`, job.tokenUsage);
		project = saveProject(window.localStorage, {
			...project,
			finalization: {
				...project.finalization,
				research: { jobId: job.id, status: job.status, result: job.result },
				plan: job.result ? project.finalization.plan : null
			}
		});
		finalizationMessage = job.message ?? '';
		if (job.status === 'completed' || job.status === 'partial')
			performSageEvent('research-complete', project);
		if (job.status === 'failed') performSageEvent('research-failed', project);
	}

	async function startFocusedResearch() {
		if (
			!project ||
			focusedResearchBusy ||
			focusedResearchIsActive ||
			finalPlanBusy ||
			project.finalization.research.result
		)
			return;
		const input = focusedResearchRequest(project);
		if (!input) {
			finalizationMessage = 'The sealed project configuration is incomplete.';
			return;
		}
		const projectId = project.id;
		const sequence = ++focusedStartSequence;
		const fingerprint = focusedRequestFingerprint(input);
		focusedResearchBusy = true;
		project = saveProject(window.localStorage, {
			...project,
			finalization: {
				...project.finalization,
				configurationFingerprint: fingerprint,
				research: { jobId: null, status: 'failed', result: null },
				plan: null,
				planStatus: 'idle',
				printPresented: false
			}
		});
		finalizationMessage = isDemoProject(project)
			? 'Loading the canned configured-project investigation...'
			: 'Checking your chosen build against the evidence...';
		performSageEvent('research-started', project);
		try {
			if (isDemoProject(project)) {
				persistFocusedResearchJob(createDemoFocusedResearchJob(input, 'running'));
				return;
			}
			const response = await fetch(resolve('/api/focused-research/jobs'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(input)
			});
			const body: unknown = await response.json();
			if (!response.ok) {
				if (!currentFocusedRequestMatches(projectId, fingerprint)) return;
				const error = body as { message?: unknown };
				finalizationMessage =
					typeof error.message === 'string' ? error.message : 'Focused research could not start.';
				return;
			}
			const job = parseFocusedResearchJobView(body);
			if (!job) throw new Error('Invalid focused research job');
			if (!currentFocusedRequestMatches(projectId, fingerprint)) {
				await fetch(resolve(`/api/focused-research/jobs/${job.id}`), { method: 'DELETE' });
				return;
			}
			persistFocusedResearchJob(job);
		} catch {
			if (!currentFocusedRequestMatches(projectId, fingerprint)) return;
			finalizationMessage = 'Focused research could not start. Your chosen project is still saved.';
		} finally {
			if (sequence === focusedStartSequence) focusedResearchBusy = false;
		}
	}

	function completeDemoFocusedResearch(jobId: string) {
		if (!project || project.finalization.research.jobId !== jobId || !isDemoProject(project))
			return;
		const input = focusedResearchRequest(project);
		if (!input) return;
		persistFocusedResearchJob(createDemoFocusedResearchJob(input, 'completed'));
	}

	async function pollFocusedResearchJob(jobId: string) {
		if (!project || !focusedResearchIsActive || project.finalization.research.jobId !== jobId)
			return;
		const projectId = project.id;
		try {
			const response = await fetch(resolve(`/api/focused-research/jobs/${jobId}`));
			const body: unknown = await response.json();
			if (
				!project ||
				project.id !== projectId ||
				project.finalization.research.jobId !== jobId ||
				!focusedResearchIsActive
			)
				return;
			if (!response.ok && response.status !== 404) throw new Error('Temporary status failure');
			if (!response.ok) {
				const error = body as { message?: unknown };
				project = saveProject(window.localStorage, {
					...project,
					finalization: {
						...project.finalization,
						research: { jobId: null, status: 'failed', result: null },
						plan: null
					}
				});
				finalizationMessage =
					typeof error.message === 'string'
						? error.message
						: 'The focused research job disappeared.';
				return;
			}
			const job = parseFocusedResearchJobView(body);
			if (!job) throw new Error('Invalid focused research job');
			persistFocusedResearchJob(job);
		} catch {
			if (!project || project.id !== projectId || project.finalization.research.jobId !== jobId)
				return;
			finalizationMessage =
				'The focused research status could not be refreshed. I will keep trying.';
		}
	}

	async function cancelFocusedResearch(silent = false) {
		const jobId = project?.finalization.research.jobId;
		if (!project || !jobId || !focusedResearchIsActive) return;
		const projectId = project.id;
		if (isDemoProject(project)) {
			project = saveProject(window.localStorage, {
				...project,
				finalization: {
					...project.finalization,
					research: { jobId, status: 'cancelled', result: null },
					plan: null
				}
			});
			if (!silent) finalizationMessage = 'Canned focused research cancelled.';
			return;
		}
		try {
			const response = await fetch(resolve(`/api/focused-research/jobs/${jobId}`), {
				method: 'DELETE'
			});
			const body: unknown = await response.json();
			const job = response.ok ? parseFocusedResearchJobView(body) : null;
			if (job && project?.id === projectId && project.finalization.research.jobId === jobId)
				persistFocusedResearchJob(job);
		} catch {
			if (!silent && project?.id === projectId)
				finalizationMessage = 'The cancellation signal did not reach the server.';
		}
	}

	function cancelFinalPlan() {
		if (!project || !finalPlanController) return;
		finalPlanController.abort();
		finalizationMessage = 'Plan generation cancelled. Your completed research is saved.';
		project = saveProject(window.localStorage, {
			...project,
			finalization: { ...project.finalization, planStatus: 'failed' }
		});
	}

	$effect(() => {
		if (
			project?.stage !== 'focused' &&
			finalPlanBusy &&
			project?.finalization.planStatus === 'running'
		)
			cancelFinalPlan();
	});

	async function generateFinalPlan() {
		if (!project || finalPlanBusy || !project.finalization.research.result) return;
		const base = focusedResearchRequest(project);
		if (!base || finalizationConflicts(base, project.finalization).length) return;
		const projectId = project.id;
		const fingerprint = focusedRequestFingerprint(base);
		const controller = new AbortController();
		finalPlanController = controller;
		const input: FinalRecalculationRequest = {
			...base,
			focusedResearch: project.finalization.research.result
		};
		finalPlanBusy = true;
		project = saveProject(window.localStorage, {
			...project,
			finalization: { ...project.finalization, planStatus: 'running' }
		});
		finalizationMessage = isDemoProject(project)
			? 'Playing the canned recalculation...'
			: 'Updating costs, requirements and development steps for your chosen build...';
		try {
			let plan;
			if (isDemoProject(project)) {
				await new Promise((resolveDelay) => window.setTimeout(resolveDelay, 900));
				plan = createDemoFinalPlan(input);
			} else {
				const response = await fetch(resolve('/api/final-plan'), {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify(input),
					signal: controller.signal
				});
				recordApiUsage(response);
				const body: unknown = await response.json();
				if (!currentFocusedRequestMatches(projectId, fingerprint) || controller.signal.aborted)
					return;
				if (!response.ok) {
					const error = body as { message?: unknown };
					finalizationMessage =
						typeof error.message === 'string' ? error.message : 'The recalculation failed.';
					return;
				}
				plan = parseFinalProjectPlan(body, input);
				if (!plan) throw new Error('Invalid final project plan');
			}
			if (
				!project ||
				!currentFocusedRequestMatches(projectId, fingerprint) ||
				controller.signal.aborted
			)
				return;
			project = saveProject(window.localStorage, {
				...project,
				completedStages: finalizationConflicts(base, { ...project.finalization, plan }).length
					? project.completedStages.filter((stage) => stage !== 'focused')
					: Array.from(new Set([...project.completedStages, 'focused'])),
				finalization: { ...project.finalization, plan, planStatus: 'ready', printPresented: false }
			});
			finalizationMessage = 'Your final plan is saved with updated estimates and requirements.';
			performSageEvent('final-plan-ready', project);
		} catch {
			if (!currentFocusedRequestMatches(projectId, fingerprint) || controller.signal.aborted)
				return;
			finalizationMessage =
				'The recalculated project file did not stabilize. Focused research is still saved.';
		} finally {
			if (
				project &&
				project.id === projectId &&
				project.finalization.configurationFingerprint === fingerprint &&
				!project.finalization.plan
			) {
				project = saveProject(window.localStorage, {
					...project,
					finalization: { ...project.finalization, planStatus: 'failed' }
				});
			}
			if (finalPlanController === controller) {
				finalPlanBusy = false;
				finalPlanController = null;
			}
		}
	}

	async function downloadFinalPdf() {
		if (!finalReport || pdfBusy) return;
		pdfBusy = true;
		pdfMessage = 'The Sage is feeding the finished file into the PDF forge...';
		try {
			const response = await fetch(resolve('/api/report/pdf'), {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(finalReport)
			});
			if (!response.ok) {
				let message = 'The PDF forge jammed. The browser report is still intact.';
				try {
					const body: unknown = await response.json();
					if (
						typeof body === 'object' &&
						body !== null &&
						'message' in body &&
						typeof body.message === 'string'
					)
						message = body.message;
				} catch {
					// Keep the stable forge error when a proxy returns a non-JSON error page.
				}
				throw new Error(message);
			}
			const blob = await response.blob();
			if (blob.type !== 'application/pdf' || blob.size < 1_000)
				throw new Error('The forge returned an empty artifact. Try the download again.');
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = safeReportFilename(finalReport.productName);
			document.body.append(link);
			link.click();
			link.remove();
			window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
			pdfMessage = `PDF forged. ${blob.size.toLocaleString('en-US')} bytes escaped the machine.`;
		} catch (error) {
			pdfMessage =
				error instanceof Error
					? error.message
					: 'The PDF forge jammed. The browser report is still intact.';
		} finally {
			pdfBusy = false;
		}
	}

	function startOver() {
		focusedStartSequence += 1;
		finalPlanController?.abort();
		finalPlanController = null;
		resetWorldSignal += 1;
		const retainedMuted = project?.personality.muted ?? previewMuted;
		const retainedCalm = project?.personality.calmMode ?? previewCalm;
		void cancelResearchJob(true);
		void cancelFocusedResearch(true);
		if (project) {
			clearChaosRun(window.localStorage, project.id);
			clearTokenUsage(window.localStorage, project.id);
		}
		clearProject(window.localStorage);
		project = null;
		stateNotice = 'The active project was cleared. The oracle is ready for a new one.';
		technologyTagDraft = '';
		industryTagDraft = '';
		preferenceError = '';
		preferencesSealed = false;
		insightStatus = 'idle';
		insightMessage = '';
		insightRequestSequence += 1;
		completedInsightSignature = '';
		researchBusy = false;
		researchMessage = '';
		interviewBusy = false;
		interviewMessage = '';
		conceptBusy = false;
		conceptMessage = '';
		focusedResearchBusy = false;
		finalPlanBusy = false;
		finalizationMessage = '';
		pdfBusy = false;
		pdfMessage = '';
		playerNameDraft = '';
		projectNameDraft = '';
		customAnswer = '';
		customAnswerOpen = false;
		preferenceStep = 0;
		pauseMenuOpen = false;
		sageSpeaking = false;
		previewMuted = retainedMuted;
		previewCalm = retainedCalm;
		void oracleAudio?.setEnabled(false);
		resetDialog?.close();
	}
</script>

<svelte:head>
	<title>Ideation Akinator</title>
	<meta
		name="description"
		content="Turn a stubborn problem into four researched product ideas and a practical PRD."
	/>
</svelte:head>

<svelte:window onkeydown={handleAppKeydown} />

<div class="star-field" aria-hidden="true"></div>

{#if !data.authenticated}
	<LoginTerminal
		configurationReady={data.configurationReady}
		{submitting}
		formMessage={form?.message ?? ''}
		onSubmit={enhanceLogin}
	/>
{:else}
	{#if mainMenuOpen}
		<MainMenu
			ready={stateReady}
			{project}
			onContinue={continueFromMenu}
			onNew={newFromMenu}
			onDemo={demoFromMenu}
		/>
	{/if}
	<div
		class="app-frame vertical-game"
		inert={mainMenuOpen}
		aria-hidden={mainMenuOpen}
		class:dialogue-layout={visualProject.stage !== 'concepts'}
		class:calm-mode={visualProject.personality.calmMode}
		data-stage={visualProject.stage}
		data-era={worldEra}
	>
		<VerticalWorld
			runId={visualProject.id}
			paused={mainMenuOpen || pauseMenuOpen}
			interactionsPaused={project?.stage === 'concepts' ||
				project?.stage === 'focused' ||
				workstationView?.purpose === 'concepts'}
			altitude={sceneryAltitude}
			stage={visualProject.stage}
			calm={visualProject.personality.calmMode}
			clues={visualProject.problemInput.cards
				.map((card) => card.text)
				.filter((text) => text.trim())}
			resetSignal={resetWorldSignal}
			onEraChange={(index) => (sceneryEraIndex = index)}
			onInteract={() => playSageCue('blip')}
		/>
		{#if stateReady}
			<SageStage
				personality={visualProject.personality}
				altitude={sageAltitude}
				researching={researchIsActive}
				workstation={workstationView}
				onFallbackChange={(fallback) => (sageModelFallback = fallback)}
				paused={mainMenuOpen ||
					pauseMenuOpen ||
					(project?.stage === 'focused' && !finalPrintActive)}
				speaking={sageSpeaking || banterSpeaking}
				voicePulse={sageVoicePulse}
				voiceEnergy={sageVoiceEnergy}
				performance={sagePerformance}
				resetSignal={resetWorldSignal}
				allowPopup={!!project &&
					project.stage !== 'welcome' &&
					project.stage !== 'focused' &&
					!researchIsActive &&
					!workstationView}
				onAnchors={(anchors) => (sageAnchors = anchors)}
				onEffect={playOracleEffect}
				onSecret={findForbiddenFloppy}
			/>
		{/if}
		{#if stateReady && project?.stage === 'research' && (broadResearchIsActive || (project.research.result && broadResearchPerformanceOpen))}
			<ResearchWorkstation
				paused={pauseMenuOpen || mainMenuOpen}
				active={true}
				calm={project.personality.calmMode || broadResearchSkipped || sageModelFallback}
				projectId={project.id}
				task="broad"
				message={researchMessage}
				sourceCount={researchSourceCount}
				complete={!!project.research.result}
				summary={project.research.result?.summary ?? ''}
				findings={project.research.result?.findings ?? []}
				gaps={project.research.result?.gaps ?? []}
				findingCount={project.research.result?.findings.length ?? 0}
				gapCount={project.research.result?.gaps.length ?? 0}
				onCancel={() => cancelResearchJob()}
				sources={project.research.result?.sources ?? []}
				disclaimer={project.research.result?.disclaimer ?? ''}
				onContinue={() => {
					broadResearchPerformanceOpen = false;
					enterInterview();
				}}
				onSkip={skipBroadResearchPerformance}
				anchors={sageAnchors}
				onWorkstationChange={(view) => (workstationView = view)}
				onPerformanceChange={(performance) => (sagePerformance = performance)}
				onEffect={playOracleEffect}
			/>
		{/if}
		{#if presentationDebugMode === 'clips'}
			<aside class="sage-motion-lab" aria-label="Sage animation debug scene">
				<header><b>SAGE MOTION LAB</b><span>{sagePerformance ?? 'idle'}</span></header>
				<div>
					{#each sageDebugClips as clip (clip)}
						<button
							type="button"
							class:active={sagePerformance === clip || (!sagePerformance && clip === 'idle')}
							onclick={() => {
								sagePerformance = null;
								window.setTimeout(() => (sagePerformance = clip), 20);
							}}>{clip.replaceAll('_', ' ')}</button
						>
					{/each}
				</div>
			</aside>
		{/if}
		{#if historyObjectOpen}
			<div class="answer-history-object" role="status" aria-live="polite">
				<div class="history-reel"><i></i><i></i></div>
				<span>REWINDING ONE QUESTION...</span>
			</div>
		{/if}
		{#if project && project.stage !== 'welcome' && project.stage !== 'concepts' && project.stage !== 'focused'}
			<ChaosLayer
				eraIndex={sceneryEraIndex}
				projectId={project.id}
				stage={project.stage}
				calm={project.personality.calmMode}
				researching={researchIsActive || !!project.finalization.plan}
				tutorialComplete={project.personality.achievements.includes('FORBIDDEN FLOPPY')}
				onAchievement={grantAchievement}
				onCue={playSageCue}
				onPurlShoo={() => performSageEvent('purl-shooed')}
				onPurlHelp={() => performSageEvent('purl-helped')}
			/>
		{/if}
		<header class="game-hud">
			{#if demoMode}<span class="demo-badge token-free">NO TOKENS</span>{/if}
			<button
				class="pause-button"
				type="button"
				onclick={togglePauseMenu}
				aria-expanded={pauseMenuOpen}
				aria-controls="game-pause-menu"
			>
				<span aria-hidden="true">▮▮</span> Menu
			</button>
			{#if pauseMenuOpen}
				<section id="game-pause-menu" class="pause-menu" aria-label="Game menu">
					<header>
						<span>SAGE_OS</span><button type="button" onclick={togglePauseMenu}>×</button>
					</header>
					<p>THE RITUAL IS PAUSED</p>
					<button type="button" onclick={toggleSageAudio}>
						{visualProject.personality.muted ? 'Sound: off' : 'Sound: on'}
					</button>
					<button type="button" onclick={toggleCalmMode}>
						{visualProject.personality.calmMode ? 'Chaos: restrained' : 'Chaos: enabled'}
					</button>
					{#if demoMode}<button type="button" onclick={restartDemo}>Restart demo</button>{/if}
					{#if project}
						<button
							type="button"
							onclick={() => {
								pauseMenuOpen = false;
								requestStartOver();
							}}>Start over</button
						>
					{/if}
					<form method="POST" action="?/logout">
						<button type="submit">Lock workshop</button>
					</form>
					<small>ESC closes this extremely advanced menu.</small>
				</section>
			{/if}
		</header>

		<div class="workspace" class:has-companion={project && project.stage !== 'welcome'}>
			{#if stateReady && project && !mainMenuOpen}
				{#key project.id}<SageBanter
						personality={project.personality}
						stage={project.stage}
						phase={project.finalization.printPresented
							? 'results'
							: finalPlanBusy
								? 'plan'
								: project.stage}
						era={sceneryEraIndex}
						paused={pauseMenuOpen}
						primarySpeaking={sageSpeaking}
						onSpeakingChange={(speaking) => (banterSpeaking = speaking)}
						onVoice={playSageVoice}
					/>{/key}
			{/if}
			{#if visualProject.stage !== 'concepts'}
				<main class="dialogue-workbench">
					{#if stateNotice && project?.stage !== 'focused' && project?.stage !== 'concepts'}
						<div class="floating-state-notice" role="status">{stateNotice}</div>
					{/if}

					{#if !stateReady}
						<SageDialogue
							altitude={sageAltitude}
							personality={visualProject.personality}
							mode="wait"
							label="RESTORING THE PROPHECY"
							prompt="I am reopening the project saved in this browser."
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="dialogue-loader"><i></i><span>Reading saved project...</span></div>
						</SageDialogue>
					{:else if project?.stage === 'problem'}
						<SageDialogue
							altitude={sageAltitude}
							personality={project.personality}
							layout="journal"
							dialogueId={`${project.id}:problem`}
							label="YOUR QUEST JOURNAL"
							meta={`${filledProblemCount} related problem${filledProblemCount === 1 ? '' : 's'}`}
							prompt="What keeps going wrong? Tell me who it affects and why it matters. Rough notes are enough."
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="problem-journal">
								<aside class="journal-notes" aria-label="Your related problems">
									<h2>Problem notes</h2>
									{#each project.problemInput.cards as card, index (card.id)}
										<div class="journal-note" class:active={activeProblemCard?.id === card.id}>
											<button
												type="button"
												class="note-select"
												aria-pressed={activeProblemCard?.id === card.id}
												onclick={() => (activeProblemId = card.id)}
											>
												<b>NOTE {index + 1}</b><span>{card.text || 'An unwritten problem...'}</span>
											</button>
											<div class="note-tools">
												<button
													type="button"
													aria-label={`Move note ${index + 1} up`}
													disabled={index === 0}
													onclick={() => moveProblem(index, -1)}>↑</button
												>
												<button
													type="button"
													aria-label={`Move note ${index + 1} down`}
													disabled={index === project.problemInput.cards.length - 1}
													onclick={() => moveProblem(index, 1)}>↓</button
												>
												<button type="button" onclick={() => removeProblem(card.id)}>Remove</button>
											</div>
										</div>
									{/each}
									<button
										type="button"
										class="answer-button secondary"
										disabled={!activeProblemCard?.text.trim()}
										onclick={addProblem}>+ Related problem</button
									>
								</aside>
								<div class="journal-editor">
									<label class="compact-field"
										><span>Topic <small>optional</small></span>
										<input
											type="text"
											maxlength="120"
											value={project.problemInput.topic}
											placeholder="Campus transit, meal planning..."
											oninput={(event) => setTopic(event.currentTarget.value)}
										/>
									</label>
									{#if activeProblemCard}<label class="compact-field">
											<span>What happens, who is affected, and why does it matter?</span>
											<textarea
												rows="5"
												maxlength="500"
												value={activeProblemCard.text}
												placeholder="Students miss the last bus because schedule changes are buried in PDF notices."
												oninput={(event) =>
													setProblemText(activeProblemCard.id, event.currentTarget.value)}
											></textarea>
										</label>{/if}
									<div class="journal-reading" aria-live="polite">
										<b>{project.problemInput.clarityLabel ?? 'Waiting for a clue'}</b><span
											>{insightStatus === 'idle'
												? 'The Sage reads while you write.'
												: insightMessage}</span
										>
									</div>
									{#if project.problemInput.topicCoherenceWarning}<p class="dialogue-warning">
											{project.problemInput.topicCoherenceWarning}
										</p>{/if}
									<button
										type="button"
										class="answer-button primary"
										disabled={filledProblemCount === 0}
										onclick={goToPreferences}>Set preferences and limits →</button
									>
								</div>
							</div>
						</SageDialogue>
					{:else if project?.stage === 'preferences'}
						<SageDialogue
							altitude={sageAltitude}
							personality={project.personality}
							layout="journal"
							dialogueId={`${project.id}:preferences:${preferenceStep}`}
							label={preferenceStep === 0 ? 'DIRECTION · 1 OF 2' : 'LIMITS · 2 OF 2'}
							meta="Your project brief"
							prompt={preferenceStep === 0
								? 'Choose the territory and tools. I have made a few suggestions from your notes.'
								: 'Set the limits of this quest. Big ideas still have to fit the wallet.'}
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="dialogue-form preference-response">
								{#if preferenceStep === 0}<div class="preferences-columns">
										<section>
											<TagPicker
												id="preferred-technologies"
												label="Preferred technology"
												selected={project.preferences.technologyTags}
												suggestions={project.preferences.suggestedTechnologyTags ?? []}
												dismissed={project.preferences.dismissedTechnologyTags ?? []}
												catalog={[
													'Open to anything',
													'TypeScript',
													'Python',
													'JavaScript',
													'Arduino',
													'Raspberry Pi',
													'Web app',
													'Mobile app',
													'3D printing',
													'Bluetooth',
													'OpenStreetMap',
													'Computer vision',
													'Robotics'
												]}
												onAdd={(tag) => addTag('technology', tag)}
												onRemove={(tag) => removeTag('technology', tag)}
												onDismiss={(tag) => removeTag('technology', tag)}
											/>
											<button
												class="answer-button secondary"
												type="button"
												onclick={() => addTag('technology', 'Open to anything')}
												>I'm open to suggestions</button
											>
											<details class="technology-exclusions">
												<summary>Technologies to avoid</summary>
												<p>
													These are hard exclusions for all four ideas. Removing a preferred tag
													above only removes the preference.
												</p>
												<TagPicker
													id="excluded-technologies"
													maxTags={10}
													maxCharacters={480}
													label="Never require these technologies"
													selected={(project?.preferences.constraints.excludedTechnologies ?? '')
														.split(',')
														.map((tag) => tag.trim())
														.filter(Boolean)}
													catalog={[
														'Robotics',
														'Computer vision',
														'Cloud services',
														'Bluetooth',
														'Arduino',
														'Raspberry Pi'
													]}
													onAdd={(tag) =>
														setConstraint(
															'excludedTechnologies',
															[
																...(project?.preferences.constraints.excludedTechnologies ?? '')
																	.split(',')
																	.filter(Boolean),
																tag
															].join(',')
														)}
													onRemove={(tag) =>
														setConstraint(
															'excludedTechnologies',
															(project?.preferences.constraints.excludedTechnologies ?? '')
																.split(',')
																.filter((entry) => entry !== tag)
																.join(',')
														)}
												/>
											</details>
										</section>
										<section>
											<TagPicker
												id="research-topics"
												label="Industries and research topics"
												selected={project.preferences.selectedIndustryTags}
												suggestions={project.preferences.suggestedIndustryTags}
												dismissed={project.preferences.dismissedIndustryTags}
												catalog={[
													'Higher Education',
													'Transportation',
													'Healthcare',
													'Manufacturing',
													'Consumer Software',
													'Accessibility',
													'Sustainability',
													'Logistics',
													'Food',
													'Entertainment'
												]}
												onAdd={(tag) => addTag('industry', tag)}
												onRemove={(tag) => removeTag('industry', tag)}
											/>
										</section>
									</div>{:else}
									<div class="rpg-meter innovation-meter">
										<header>
											<b>{project.preferences.innovationLevel}</b>
											<span>{innovationLabels[project.preferences.innovationLevel - 1]}</span>
										</header>
										<input
											type="range"
											min="1"
											max="5"
											step="1"
											value={project.preferences.innovationLevel}
											oninput={(event) => setInnovationLevel(event.currentTarget.valueAsNumber)}
											aria-label="Innovation level"
										/>
										<div class="originality-labels">
											<span>Proven approach</span><span>Strange but buildable</span>
										</div>
									</div>

									<div class="budget-workbench">
										<BudgetMeter
											id="prototype-budget"
											label="Prototype budget"
											value={project.preferences.prototypeBudgetUsd}
											calm={project.personality.calmMode}
											onChange={(value) => updateBudget('prototype', value)}
										/>
										<div class="production-budget">
											<label class="production-check"
												><input
													type="checkbox"
													checked={project.preferences.includeProductionPlanning}
													onchange={(event) => setProductionPlanning(event.currentTarget.checked)}
												/><span>Also plan production costs</span></label
											>
											{#if project.preferences.includeProductionPlanning}<BudgetMeter
													id="production-budget"
													label="Production budget"
													value={project.preferences.productionBudgetUsd}
													calm={project.personality.calmMode}
													onChange={(value) => updateBudget('production', value)}
												/>{:else}<p>Only the first working prototype will be budgeted.</p>{/if}
										</div>
									</div>
									<details class="extra-limits">
										<summary>Deadline, team, and other limits</summary>
										<div class="practical-constraints">
											{#each constraintFields as field (field.key)}
												<label class:wide={field.wide}>
													<span>{field.label} <small>optional</small></span>
													<input
														type="text"
														maxlength="500"
														value={project.preferences.constraints[field.key] ?? ''}
														placeholder={field.placeholder}
														oninput={(event) => setConstraint(field.key, event.currentTarget.value)}
													/>
												</label>
											{/each}
										</div>
									</details>{/if}

								{#if preferenceError}<p class="dialogue-warning" role="alert">
										{preferenceError}
									</p>{/if}
								<div class="dialogue-primary-actions split">
									<button
										class="answer-button secondary"
										type="button"
										onclick={previousPreferenceStep}>Back</button
									>
									{#if preferenceStep < 1}
										<button class="answer-button primary" type="button" onclick={nextPreferenceStep}
											>Save and continue</button
										>
									{:else}
										<button class="answer-button primary" type="button" onclick={sealPreferences}
											>Research these problems</button
										>
									{/if}
								</div>
							</div>
						</SageDialogue>
					{:else if project?.stage === 'research'}
						{#if project.research.status === 'idle'}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								label="RESEARCH THE PROBLEM"
								meta="usually one to two minutes"
								prompt="Ready for me to check what already exists and where the gaps are?"
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form research-launch">
									<p>
										I will search for competitors, similar tools, failed attempts, prior art,
										standards, customer complaints, and useful technical building blocks. You can
										inspect every source afterward.
									</p>
									<div class="research-boundary-chips">
										<span
											>${project.preferences.prototypeBudgetUsd?.toLocaleString()} prototype</span
										>{#each project.preferences.selectedIndustryTags as tag (tag)}<span>{tag}</span
											>{/each}
									</div>
									{#if researchMessage}<p class="dialogue-warning" role="alert">
											{researchMessage}
										</p>{/if}
									<div class="dialogue-primary-actions">
										<button class="answer-button secondary" type="button" onclick={goToPreferences}
											>Back to constraints</button
										><button
											class="answer-button primary"
											type="button"
											disabled={researchBusy}
											onclick={startBroadResearch}
											>{researchBusy ? 'Finding the computer...' : 'Begin research'}</button
										>
									</div>
								</div>
							</SageDialogue>
						{:else if broadResearchIsActive || (project.research.result && broadResearchPerformanceOpen)}
							<!-- The performance is a sibling of the Sage so its rear and foreground layers can straddle him. -->
						{:else if project.research.result}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								layout="journal"
								dialogueId={`${project.id}:research-brief`}
								label="PRELIMINARY RESEARCH"
								meta={`${project.research.result.sources.length} sources`}
								prompt="Here is what I found. These notes will help us choose a useful direction."
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<ResearchBrief
									summary={project.research.result.summary}
									findings={project.research.result.findings}
									gaps={project.research.result.gaps}
									sources={project.research.result.sources}
									disclaimer={project.research.result.disclaimer}
									onContinue={enterInterview}
								/>
							</SageDialogue>
						{:else}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="announce"
								label="THE SIGNAL BROKE"
								prompt={researchMessage || 'The large computer has betrayed us.'}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form">
									<p>Your problems, preferences, and budget are still saved.</p>
									<div class="dialogue-primary-actions">
										<button class="answer-button secondary" type="button" onclick={goToPreferences}
											>Check limitations</button
										><button
											class="answer-button primary"
											type="button"
											onclick={retryBroadResearch}>Try a fresh pass</button
										>
									</div>
								</div>
							</SageDialogue>
						{/if}
					{:else if project?.stage === 'questions'}
						{#if project.interview.status === 'completed' || project.interview.status === 'ended-early'}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="announce"
								label="INTERVIEW COMPLETE"
								meta={`${answeredQuestionCount} responses recorded`}
								prompt={project.interview.status === 'ended-early'
									? 'You ended the interview early, so the four concepts may be less precise.'
									: 'I have enough context to generate four project concepts for you to compare.'}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form">
									<p>{project.interview.completionReason}</p>
									<div class="dialogue-primary-actions">
										<button class="answer-button secondary" type="button" onclick={goToResearch}
											>Review research</button
										><button class="answer-button primary" type="button" onclick={enterConceptRoom}
											>{project.concepts.portfolio
												? 'Return to the four concepts'
												: 'Generate four project concepts'}</button
										>
									</div>
								</div>
							</SageDialogue>
						{:else if !currentQuestion}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="wait"
								label="FORMING THE NEXT INQUIRY"
								prompt={interviewBusy
									? 'My modem is choosing one useful question.'
									: 'The next question fell behind the desk.'}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div class="dialogue-form">
									{#if interviewMessage}<p class="dialogue-warning">
											{interviewMessage}
										</p>{/if}{#if !interviewBusy}<button
											class="answer-button primary"
											type="button"
											onclick={() => requestNextInterview()}>Try the question again</button
										>{/if}
								</div>
							</SageDialogue>
						{:else}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								dialogueId={`${project.id}:question:${currentQuestion.id}`}
								label={`INQUIRY ${project.interview.currentQuestionIndex + 1}`}
								meta={`${answeredQuestionCount} answered`}
								prompt={currentQuestion.prompt}
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<div
									class="dialogue-form interview-response"
									aria-busy={interviewBusy || answerConfirming}
								>
									<details class="why-whisper">
										<summary>Why are you asking?</summary>
										<p>{currentQuestion.whyItMatters}</p>
									</details>
									{#if currentQuestion.type === 'text'}
										<label class="compact-field main-response"
											><span>Your answer</span><textarea
												rows="4"
												maxlength="500"
												bind:value={textAnswer}
												disabled={interviewBusy || answerConfirming}
												placeholder="A rough answer is enough..."></textarea></label
										>
									{:else if currentQuestion.type === 'single-choice'}
										<div class="game-choice-list">
											{#each currentQuestion.options as option (option.id)}<button
													type="button"
													disabled={interviewBusy || answerConfirming}
													class:confirmed-answer={answerConfirming &&
														confirmedAnswer === JSON.stringify(option.id)}
													onclick={() => {
														customAnswerOpen = false;
														submitInterviewAnswer('answered', option.id);
													}}>{option.label}</button
												>{/each}<button
												class:chosen={customAnswerOpen}
												disabled={interviewBusy || answerConfirming}
												type="button"
												onclick={openCustomAnswer}>Something else...</button
											>
										</div>
									{:else if currentQuestion.type === 'multiple-choice'}
										<div class="game-choice-list multiple">
											{#each currentQuestion.options as option (option.id)}<button
													class:chosen={multipleAnswer.includes(option.id)}
													disabled={interviewBusy || answerConfirming}
													type="button"
													onclick={() =>
														toggleMultipleAnswer(option.id, !multipleAnswer.includes(option.id))}
													><span>{multipleAnswer.includes(option.id) ? '✓' : '+'}</span
													>{option.label}</button
												>{/each}<button
												class:chosen={customAnswerOpen}
												disabled={interviewBusy || answerConfirming}
												type="button"
												onclick={() => (customAnswerOpen = !customAnswerOpen)}
												>Something else...</button
											>
										</div>
									{:else if currentQuestion.type === 'yes-no'}
										<div class="game-choice-list two">
											<button
												type="button"
												disabled={interviewBusy || answerConfirming}
												class:confirmed-answer={answerConfirming && confirmedAnswer === 'true'}
												onclick={() => submitInterviewAnswer('answered', true)}>Yes</button
											><button
												type="button"
												disabled={interviewBusy || answerConfirming}
												class:confirmed-answer={answerConfirming && confirmedAnswer === 'false'}
												onclick={() => submitInterviewAnswer('answered', false)}>No</button
											>
										</div>
									{:else}
										<label class="compact-field"
											><span
												>{currentQuestion.type === 'budget'
													? 'Amount in USD'
													: (currentQuestion.unit ?? 'Number')}</span
											><input
												type="number"
												min={currentQuestion.minimum ?? undefined}
												max={currentQuestion.maximum ?? undefined}
												bind:value={numberAnswer}
												disabled={interviewBusy || answerConfirming}
												placeholder="0"
											/></label
										>
									{/if}

									{#if customAnswerOpen}<label class="compact-field custom-answer"
											><span>Type your own answer</span>
											<div>
												<input
													bind:value={customAnswer}
													disabled={interviewBusy || answerConfirming}
													maxlength="500"
													placeholder="The option the Sage somehow missed..."
												/><button
													class="answer-button primary"
													type="button"
													disabled={!customAnswer.trim() || interviewBusy || answerConfirming}
													onclick={() => submitInterviewAnswer('answered')}>Use this</button
												>
											</div></label
										>{/if}

									{#if interviewMessage}<p class="dialogue-warning" role="alert">
											{interviewMessage}
										</p>{/if}
									{#if currentQuestion.type === 'text' || currentQuestion.type === 'number' || currentQuestion.type === 'budget' || currentQuestion.type === 'multiple-choice'}<button
											class="answer-button primary full"
											type="button"
											disabled={interviewBusy || answerConfirming}
											onclick={() => submitInterviewAnswer('answered')}
											>{interviewBusy ? 'Thinking...' : 'Answer and continue'}</button
										>{/if}
									<div class="minor-answer-actions">
										<button
											type="button"
											disabled={interviewBusy || answerConfirming}
											onclick={() => submitInterviewAnswer('skipped')}>Skip this</button
										><button
											type="button"
											disabled={interviewBusy || answerConfirming}
											onclick={() => submitInterviewAnswer('unknown')}>I do not know</button
										><button
											type="button"
											disabled={interviewBusy ||
												answerConfirming ||
												project.interview.currentQuestionIndex === 0}
											onclick={previousInterviewQuestion}>Previous</button
										><button
											type="button"
											disabled={interviewBusy || answerConfirming}
											onclick={() => interviewDialog?.showModal()}>End early</button
										>
									</div>
								</div>
							</SageDialogue>
						{/if}
					{:else if project?.stage === 'focused'}
						{@const focusedInput = focusedResearchRequest(project)}
						{#if focusedInput}
							<FinalizationRoom
								paused={pauseMenuOpen || mainMenuOpen}
								workstationFallback={sageModelFallback}
								{project}
								input={focusedInput}
								finalization={project.finalization}
								personality={project.personality}
								researchBusy={focusedResearchBusy}
								planBusy={finalPlanBusy}
								report={finalReport}
								{pdfBusy}
								{pdfMessage}
								message={finalizationMessage}
								onStartResearch={startFocusedResearch}
								onCancelResearch={() => cancelFocusedResearch()}
								onSkipResearch={skipFocusedResearchPerformance}
								onGeneratePlan={generateFinalPlan}
								onCancelPlan={cancelFinalPlan}
								onPrintComplete={finishFinalPrint}
								onNewRun={requestStartOver}
								onEditLimits={goToPreferences}
								onDownloadPdf={downloadFinalPdf}
								onBack={returnToWorkshop}
								anchors={sageAnchors}
								onWorkstationChange={(view) => (workstationView = view)}
								onPerformanceChange={(performance) => (sagePerformance = performance)}
								onEffect={playOracleEffect}
							/>
						{:else}
							<SageDialogue
								altitude={sageAltitude}
								personality={project.personality}
								mode="announce"
								label="THE SEAL IS MISSING"
								prompt="Return to the workshop and choose one valid configuration."
								onSpeakCharacter={playSageVoice}
								onSpeakingChange={setSageSpeaking}
							>
								<button class="answer-button primary" type="button" onclick={returnToWorkshop}
									>Return to workshop</button
								>
							</SageDialogue>
						{/if}
					{:else}
						<SageDialogue
							altitude={sageAltitude}
							personality={visualProject.personality}
							label="WELCOME TO IDEATION AKINATOR"
							prompt="Give me a problem. I will turn it into researched, buildable project options."
							onSpeakCharacter={playSageVoice}
							onSpeakingChange={setSageSpeaking}
						>
							<div class="dialogue-form welcome-response">
								<p>
									First, describe the problem and your constraints. I will research what already
									exists, ask a short set of follow-up questions, and generate four concepts. You
									will choose the concept and features before I produce the final plan.
								</p>
								<div class="welcome-name-grid game-name-grid">
									<label
										><span>What should I call you? <small>optional</small></span><input
											maxlength="50"
											bind:value={playerNameDraft}
											placeholder="Mortal, Evan, Captain..."
										/></label
									><label
										><span>Working project name <small>probably wrong</small></span><input
											maxlength="50"
											bind:value={projectNameDraft}
											placeholder="Operation Mystery Box"
										/></label
									>
								</div>
								<button class="answer-button primary full" type="button" onclick={beginProject}
									>Start with my problem</button
								>
								<div class="demo-launch-divider"><span>or inspect the machinery</span></div>
								<button class="answer-button demo-launch full" type="button" onclick={beginDemo}>
									Run the token-free visual demo
								</button>
								<small class="demo-launch-note">
									Uses canned research, questions, and ideas. Every screen still works.
								</small>
								<small>No account. This project stays in this browser.</small>
							</div>
						</SageDialogue>
					{/if}
				</main>
			{/if}

			<main class="workbench" class:legacy-hidden={visualProject.stage !== 'concepts'}>
				{#if stateNotice && project?.stage !== 'concepts' && project?.stage !== 'focused'}
					<div class="state-notice" role="status">
						<span aria-hidden="true">i</span>
						{stateNotice}
					</div>
				{/if}

				{#if !stateReady}
					<section class="loading-panel" aria-live="polite">
						<div class="loading-orb" aria-hidden="true"></div>
						<p>Dusting off your last session...</p>
					</section>
				{:else if project?.stage === 'problem'}
					<section class="intake-room" aria-labelledby="problem-room-title">
						<div class="room-heading">
							<div>
								<p class="room-number">ROOM 01 / PROBLEM</p>
								<h1 id="problem-room-title">What keeps getting in the way?</h1>
								<p>
									Add several problems if they belong to the same general topic. Specific situations
									matter more than polished writing.
								</p>
							</div>
							<div class="reading-card" aria-label="Problem clarity reading">
								<span>CLARITY READING</span>
								<strong>{project.problemInput.clarityLabel ?? 'Signal not read yet'}</strong>
								<div class="reading-track" aria-hidden="true">
									<i style={`width: ${(clarityPosition / CLARITY_LABELS.length) * 100}%`}></i>
								</div>
								<p class="reading-status" aria-live="polite">
									{insightStatus === 'idle'
										? 'Describe a problem to start the live reading. It never blocks progress.'
										: insightMessage}
								</p>
								{#if project.problemInput.clarityReasons.length > 0}
									<ul class="reading-reasons">
										{#each project.problemInput.clarityReasons as reason (reason)}
											<li>{reason}</li>
										{/each}
									</ul>
								{/if}
								{#if project.problemInput.topicCoherenceWarning}
									<p class="coherence-warning" role="status">
										<span aria-hidden="true">!</span>{project.problemInput.topicCoherenceWarning}
									</p>
								{/if}
								{#if insightStatus === 'error' || insightStatus === 'unavailable'}
									<button class="reading-retry" type="button" onclick={retryIntakeInsights}
										>Try reading again</button
									>
								{/if}
							</div>
						</div>

						<label class="field-block topic-field">
							<span>Short topic name <small>optional</small></span>
							<input
								type="text"
								value={project.problemInput.topic}
								placeholder="Campus transportation, workshop inventory, meal planning..."
								oninput={(event) => setTopic(event.currentTarget.value)}
							/>
						</label>

						<div class="problem-list">
							{#each project.problemInput.cards as card, index (card.id)}
								<article class="problem-card">
									<div class="card-number">
										<span>PROBLEM</span><b>{String(index + 1).padStart(2, '0')}</b>
									</div>
									<label for={`problem-${card.id}`}
										>Describe what happens, who it affects, and why it is frustrating.</label
									>
									<textarea
										id={`problem-${card.id}`}
										rows="4"
										value={card.text}
										placeholder="Example: Students miss the last campus bus because route updates are posted in three different places..."
										oninput={(event) => setProblemText(card.id, event.currentTarget.value)}
									></textarea>
									<div class="card-tools">
										<button
											type="button"
											disabled={index === 0}
											onclick={() => moveProblem(index, -1)}
											aria-label={`Move problem ${index + 1} up`}>↑ Up</button
										>
										<button
											type="button"
											disabled={index === project.problemInput.cards.length - 1}
											onclick={() => moveProblem(index, 1)}
											aria-label={`Move problem ${index + 1} down`}>↓ Down</button
										>
										<button
											class="remove-control"
											type="button"
											onclick={() => removeProblem(card.id)}>Remove</button
										>
									</div>
								</article>
							{/each}
						</div>

						<button class="add-card-button" type="button" onclick={addProblem}>
							<span aria-hidden="true">+</span> Add another related problem
						</button>

						<div class="room-actions">
							<button class="text-button" type="button" onclick={requestStartOver}
								>Start over</button
							>
							<button class="summon-button compact" type="button" onclick={goToPreferences}>
								<span>Set preferences</span><i aria-hidden="true">→</i>
							</button>
						</div>
					</section>
				{:else if project?.stage === 'preferences'}
					<section class="intake-room preferences-room" aria-labelledby="preferences-room-title">
						<div class="room-heading preferences-heading">
							<div>
								<p class="room-number">ROOM 02 / PREFERENCES</p>
								<h1 id="preferences-room-title">Set the edges of the spell.</h1>
								<p>These guide the ideas. Technology choices are preferences, not hard limits.</p>
							</div>
							<div class="problem-count-card">
								<strong
									>{project.problemInput.cards.filter((card) => card.text.trim()).length}</strong
								>
								<span>problem notes</span>
								<button type="button" onclick={goToProblem}>Edit them</button>
							</div>
						</div>

						<div class="preference-sections">
							<section class="preference-panel" aria-labelledby="technology-title">
								<div class="panel-title">
									<span>01</span>
									<div>
										<h2 id="technology-title">Preferred technology</h2>
										<p>Add a tag, then press Enter or comma.</p>
									</div>
								</div>
								<div class="tag-editor">
									<div class="tag-list">
										{#each project.preferences.technologyTags as tag (tag)}
											<span class="tag-chip"
												>{tag}<button
													type="button"
													onclick={() => removeTag('technology', tag)}
													aria-label={`Remove ${tag}`}>×</button
												></span
											>
										{/each}
										<input
											bind:value={technologyTagDraft}
											onkeydown={(event) => tagKeydown(event, 'technology')}
											placeholder="TypeScript, Arduino, open to anything..."
											aria-label="Add a technology preference"
										/>
									</div>
									<button type="button" onclick={() => addTag('technology')}>Add</button>
								</div>
							</section>

							<section class="preference-panel" aria-labelledby="industry-title">
								<div class="panel-title">
									<span>02</span>
									<div>
										<h2 id="industry-title">Industries</h2>
										<p>The Sage selects likely industries. Remove any that do not fit.</p>
									</div>
								</div>
								<div class="tag-editor">
									<div class="tag-list">
										{#each project.preferences.selectedIndustryTags as tag (tag)}
											<span class="tag-chip industry"
												>{tag}{#if project.preferences.suggestedIndustryTags.some((entry) => entry.toLocaleLowerCase() === tag.toLocaleLowerCase())}<small
														>AUTO</small
													>{/if}<button
													type="button"
													onclick={() => removeTag('industry', tag)}
													aria-label={`Remove ${tag}`}>×</button
												></span
											>
										{/each}
										<input
											bind:value={industryTagDraft}
											onkeydown={(event) => tagKeydown(event, 'industry')}
											placeholder="Education, logistics, consumer..."
											aria-label="Add an industry"
										/>
									</div>
									<button type="button" onclick={() => addTag('industry')}>Add</button>
								</div>
								{#if insightStatus === 'waiting' || insightStatus === 'loading'}
									<p class="industry-reading-note" aria-live="polite">
										<span class="status-light" aria-hidden="true"></span>{insightMessage}
									</p>
								{:else if project.preferences.dismissedIndustryTags.length > 0}
									<p class="industry-reading-note">
										Removed suggestions stay out unless you add them back yourself.
									</p>
								{/if}
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="innovation-title">
								<div class="panel-title">
									<span>03</span>
									<div>
										<h2 id="innovation-title">Innovation level</h2>
										<p>Every setting still returns at least one practical idea.</p>
									</div>
								</div>
								<div class="innovation-readout">
									<b>{project.preferences.innovationLevel}</b><strong
										>{innovationLabels[project.preferences.innovationLevel - 1]}</strong
									>
								</div>
								<input
									class="innovation-range"
									type="range"
									min="1"
									max="5"
									step="1"
									value={project.preferences.innovationLevel}
									oninput={(event) => setInnovationLevel(event.currentTarget.valueAsNumber)}
									aria-labelledby="innovation-title"
								/>
								<div class="range-labels" aria-hidden="true">
									<span>Corporate</span><span>Buildable weirdness</span>
								</div>
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="budget-title">
								<div class="panel-title">
									<span>04</span>
									<div>
										<h2 id="budget-title">Total budget</h2>
										<p>
											Include design, parts, hosting, testing, fees, and other real costs. Developer
											labor is not the only expense.
										</p>
									</div>
								</div>
								<div class="budget-grid">
									<label class="money-field"
										><span>Prototype budget</span>
										<div>
											<b>$</b><input
												type="number"
												min="0"
												step="1"
												inputmode="decimal"
												value={project.preferences.prototypeBudgetUsd ?? ''}
												oninput={(event) => setBudget('prototype', event.currentTarget)}
												placeholder="2500"
											/><i>USD</i>
										</div></label
									>
									<label class="production-toggle"
										><input
											type="checkbox"
											checked={project.preferences.includeProductionPlanning}
											onchange={(event) => setProductionPlanning(event.currentTarget.checked)}
										/><span
											><strong>Plan for production</strong><small
												>Include manufacturing, launch, or production-scale costs.</small
											></span
										></label
									>
									{#if project.preferences.includeProductionPlanning}
										<label class="money-field"
											><span>Production budget</span>
											<div>
												<b>$</b><input
													type="number"
													min="0"
													step="1"
													inputmode="decimal"
													value={project.preferences.productionBudgetUsd ?? ''}
													oninput={(event) => setBudget('production', event.currentTarget)}
													placeholder="25000"
												/><i>USD</i>
											</div></label
										>
									{/if}
								</div>
							</section>

							<section class="preference-panel wide-panel" aria-labelledby="constraints-title">
								<div class="panel-title">
									<span>05</span>
									<div>
										<h2 id="constraints-title">Useful constraints</h2>
										<p>All optional. Add only what would change the ideas.</p>
									</div>
								</div>
								<div class="constraint-grid">
									{#each constraintFields as field (field.key)}
										<label class:wide={field.wide}
											><span>{field.label}</span><input
												type="text"
												value={project.preferences.constraints[field.key]}
												placeholder={field.placeholder}
												oninput={(event) => setConstraint(field.key, event.currentTarget.value)}
											/></label
										>
									{/each}
								</div>
							</section>
						</div>

						{#if preferenceError}<p class="intake-error" role="alert">{preferenceError}</p>{/if}
						{#if preferencesSealed}
							<div class="intake-success" role="status">
								<span>✓</span>
								<div>
									<strong>Intake complete</strong>
									<p>
										Your problem reading, preferences, and industry choices are saved. Broad
										research is next.
									</p>
								</div>
							</div>
						{/if}
						<div class="room-actions">
							<button class="secondary-button" type="button" onclick={goToProblem}
								>← Back to problems</button
							>
							<button class="summon-button compact" type="button" onclick={sealPreferences}
								><span>Save preferences</span><i aria-hidden="true">✓</i></button
							>
						</div>
					</section>
				{:else if project?.stage === 'research'}
					<section class="intake-room research-room" aria-labelledby="research-room-title">
						<div class="room-heading research-heading">
							<div>
								<p class="room-number">ROOM 03 / BROAD RESEARCH</p>
								<h1 id="research-room-title">Find the shape of the territory.</h1>
								<p>
									This is a one-to-two-minute foothold. It checks what exists, what failed, and
									which constraints may matter before the Sage starts asking questions.
								</p>
							</div>
							<div class="research-seal" class:lit={project.research.result}>
								<span aria-hidden="true">⌕</span>
								<strong>{project.research.result ? 'SOURCES BOUND' : 'WEB UNOPENED'}</strong>
								<small>{project.research.result?.sources.length ?? 0} saved sources</small>
							</div>
						</div>

						{#if project.research.status === 'idle'}
							<div class="research-launch-panel">
								<div>
									<p class="panel-kicker">THE SEARCH LIST</p>
									<h2>Nine places worth checking before ideation</h2>
									<div class="research-category-grid">
										{#each RESEARCH_CATEGORIES as category, index (category)}
											<span
												><b>{String(index + 1).padStart(2, '0')}</b>{researchCategoryLabels[
													category
												]}</span
											>
										{/each}
									</div>
								</div>
								<aside class="research-cost-card">
									<span>BOUNDARIES</span>
									<strong
										>${project.preferences.prototypeBudgetUsd?.toLocaleString()} prototype</strong
									>
									<p>{project.preferences.selectedIndustryTags.join(' · ')}</p>
									<button
										class="summon-button compact"
										type="button"
										disabled={researchBusy}
										onclick={startBroadResearch}
										><span>{researchBusy ? 'Opening...' : 'Begin broad research'}</span><i
											aria-hidden="true">→</i
										></button
									>
								</aside>
							</div>
						{:else if broadResearchIsActive}
							<div class="research-running" aria-live="polite">
								<div class="research-orb" aria-hidden="true"><i></i><b>?</b></div>
								<p class="panel-kicker">LIVE RESEARCH PASS</p>
								<h2>{researchMessage || 'Consulting the dusty web...'}</h2>
								<p>
									You can refresh or leave this page. The browser will reconnect while the server
									still has the job.
								</p>
								<div class="stage-lights" aria-label="Research stage progress">
									<span class:active={project.research.status === 'queued'}>Queued</span>
									<span class:active={project.research.status === 'running'}
										>Searching and checking sources</span
									>
									<span>Brief ready</span>
								</div>
								<button class="secondary-button" type="button" onclick={() => cancelResearchJob()}
									>Cancel research</button
								>
							</div>
						{:else if project.research.result}
							<div class="research-brief" aria-live="polite">
								<header>
									<div>
										<p class="panel-kicker">THE FOOTHOLD</p>
										<h2>
											{project.research.status === 'partial'
												? 'Useful evidence, with gaps'
												: 'Broad research complete'}
										</h2>
									</div>
									<span class="research-status"
										>{project.research.result.findings.length} findings</span
									>
								</header>
								<p class="research-summary">{project.research.result.summary}</p>
								<p class="research-disclaimer">{project.research.result.disclaimer}</p>

								<div class="finding-groups">
									{#each RESEARCH_CATEGORIES as category (category)}
										{@const categoryFindings = project.research.result.findings.filter(
											(finding) => finding.category === category
										)}
										{#if categoryFindings.length > 0}
											<section class="finding-group">
												<h3>{researchCategoryLabels[category]}</h3>
												{#each categoryFindings as finding (finding.id)}
													<article class="research-finding">
														<h4>{finding.title}</h4>
														<p>{finding.claim}</p>
														<div class="finding-citations" aria-label="Sources for this finding">
															{#each finding.sourceIds as sourceId (sourceId)}
																{@const source = sourceFor(sourceId)}
																{#if source}<a
																		href={source.url}
																		target="_blank"
																		rel="external noreferrer">{source.title}</a
																	>{/if}
															{/each}
														</div>
														{#if finding.interpretation}
															<p class="finding-interpretation">
																<b>Why it may matter</b>{finding.interpretation}
															</p>
														{/if}
													</article>
												{/each}
											</section>
										{/if}
									{/each}
								</div>

								{#if project.research.result.gaps.length > 0}
									<section class="research-gaps">
										<h3>Where the signal was weak</h3>
										<ul>
											{#each project.research.result.gaps as gap (`${gap.category}-${gap.reason}`)}
												<li><b>{researchCategoryLabels[gap.category]}</b>{gap.reason}</li>
											{/each}
										</ul>
									</section>
								{/if}

								<details class="source-ledger">
									<summary>Open source ledger ({project.research.result.sources.length})</summary>
									<ol>
										{#each project.research.result.sources as source (source.id)}
											<li>
												<a href={source.url} target="_blank" rel="external noreferrer"
													>{source.title}</a
												>
												<span>{source.publisher} · {source.publicationDate ?? 'date unknown'}</span>
												<p>{source.evidenceSummary}</p>
											</li>
										{/each}
									</ol>
								</details>

								<div class="research-next">
									<span>✓</span>
									<div>
										<strong>Ready for the interview</strong>
										<p>The next room will turn these gaps into one-at-a-time questions.</p>
									</div>
									<button class="summon-button compact" type="button" onclick={enterInterview}
										><span>Start interview</span><i aria-hidden="true">→</i></button
									>
								</div>
							</div>
						{:else}
							<div class="research-recovery" role="status">
								<p class="panel-kicker">THE SIGNAL BROKE</p>
								<h2>{researchMessage || 'This research pass did not finish.'}</h2>
								<p>Your problems, preferences, and budgets are still saved in this browser.</p>
								<button class="summon-button compact" type="button" onclick={retryBroadResearch}
									><span>Start a fresh pass</span><i aria-hidden="true">↻</i></button
								>
							</div>
						{/if}

						{#if researchMessage && project.research.status === 'idle'}
							<p class="intake-error" role="alert">{researchMessage}</p>
						{/if}
						<div class="room-actions">
							<button
								class="secondary-button"
								type="button"
								disabled={broadResearchIsActive}
								onclick={goToPreferences}>← Back to preferences</button
							>
							<button class="text-button" type="button" onclick={requestStartOver}
								>Start over</button
							>
						</div>
					</section>
				{:else if project?.stage === 'questions'}
					<section class="intake-room interview-room" aria-labelledby="interview-room-title">
						<div class="room-heading interview-heading">
							<div>
								<p class="room-number">ROOM 04 / CLARIFYING INTERVIEW</p>
								<h1 id="interview-room-title">Turn uncertainty into choices.</h1>
								<p>
									The Sage asks one question at a time and changes course when your answer reveals
									something useful.
								</p>
							</div>
							<div class="interview-counter">
								<strong>{answeredQuestionCount}</strong>
								<span>responses recorded</span>
								<small>Usually 5–10 questions</small>
							</div>
						</div>

						{#if project.interview.status === 'completed' || project.interview.status === 'ended-early'}
							<div class="interview-complete" aria-live="polite">
								<div class="completion-orb" aria-hidden="true">✦</div>
								<p class="panel-kicker">THE SIGNAL IS SHARP ENOUGH</p>
								<h2>
									{project.interview.status === 'ended-early'
										? 'Interview ended early'
										: 'The questions have done their job'}
								</h2>
								<p>{project.interview.completionReason}</p>
								{#if project.interview.confidence === 'reduced'}
									<span class="confidence-note"
										>Concept confidence will be marked lower because some uncertainty remains.</span
									>
								{/if}
								<div class="next-slice-note">
									<strong>Four project directions are waiting</strong>
									<p>
										The Sage will reveal one primary guess, three alternatives, and one forbidden
										stretch.
									</p>
									<button class="summon-button compact" type="button" onclick={enterConceptRoom}>
										<span
											>{project.concepts.portfolio
												? 'Return to the four futures'
												: 'Summon four projects'}</span
										><i aria-hidden="true">→</i>
									</button>
								</div>
							</div>
						{:else if !currentQuestion}
							<div class="interview-loading" aria-live="polite">
								<div class="question-mark" aria-hidden="true">?</div>
								<h2>
									{interviewBusy ? 'Choosing the first useful question...' : 'Begin the interview'}
								</h2>
								<p>
									Your research and preferences are ready. Answers save in this browser after each
									question.
								</p>
								{#if !interviewBusy}
									<button
										class="summon-button compact"
										type="button"
										onclick={() => requestNextInterview()}
										><span>{interviewMessage ? 'Try again' : 'Ask the first question'}</span><i
											aria-hidden="true">→</i
										></button
									>
								{/if}
							</div>
						{:else}
							<article class="question-card" aria-live="polite">
								<header>
									<div>
										<p class="panel-kicker">
											QUESTION {String(project.interview.currentQuestionIndex + 1).padStart(2, '0')}
										</p>
										<h2>{currentQuestion.prompt}</h2>
									</div>
									<span>{currentQuestion.type.replace('-', ' ')}</span>
								</header>
								<div class="why-question">
									<b>Why this matters</b>
									<p>{currentQuestion.whyItMatters}</p>
								</div>

								<div class="answer-area">
									{#if currentQuestion.type === 'text'}
										<label>
											<span>Your answer</span>
											<textarea
												rows="5"
												maxlength="500"
												bind:value={textAnswer}
												placeholder="A rough answer is enough..."></textarea>
										</label>
									{:else if currentQuestion.type === 'single-choice'}
										<div class="choice-list" role="radiogroup" aria-label="Answer choices">
											{#each currentQuestion.options as option (option.id)}
												<label>
													<input
														type="radio"
														name={currentQuestion.id}
														value={option.id}
														bind:group={singleAnswer}
													/>
													<span>{option.label}</span>
												</label>
											{/each}
										</div>
									{:else if currentQuestion.type === 'multiple-choice'}
										<div class="choice-list multiple" aria-label="Answer choices">
											{#each currentQuestion.options as option (option.id)}
												<label>
													<input
														type="checkbox"
														checked={multipleAnswer.includes(option.id)}
														onchange={(event) =>
															toggleMultipleAnswer(option.id, event.currentTarget.checked)}
													/>
													<span>{option.label}</span>
												</label>
											{/each}
										</div>
									{:else if currentQuestion.type === 'yes-no'}
										<div class="yes-no-choices" aria-label="Yes or no">
											<button
												class:chosen={yesNoAnswer === true}
												type="button"
												onclick={() => (yesNoAnswer = true)}>Yes</button
											>
											<button
												class:chosen={yesNoAnswer === false}
												type="button"
												onclick={() => (yesNoAnswer = false)}>No</button
											>
										</div>
									{:else}
										<label class="numeric-answer">
											<span>Your answer</span>
											<div class:no-prefix={currentQuestion.type !== 'budget'}>
												{#if currentQuestion.type === 'budget'}<b>$</b>{/if}
												<input
													type="number"
													min={currentQuestion.minimum ?? undefined}
													max={currentQuestion.maximum ?? undefined}
													bind:value={numberAnswer}
													placeholder="0"
												/>
												{#if currentQuestion.unit}<i>{currentQuestion.unit}</i>{/if}
											</div>
										</label>
									{/if}
								</div>

								{#if currentAnswer}
									<p class="saved-answer-note">
										Saved as <b>{currentAnswer.status}</b>. Continuing after an edit will replace
										later follow-ups.
									</p>
								{/if}
								<div class="answer-actions">
									<button
										class="secondary-button"
										type="button"
										disabled={interviewBusy || answerConfirming}
										onclick={() => submitInterviewAnswer('skipped')}>Skip</button
									>
									<button
										class="secondary-button"
										type="button"
										disabled={interviewBusy || answerConfirming}
										onclick={() => submitInterviewAnswer('unknown')}>I don’t know</button
									>
									<button
										class="summon-button compact"
										type="button"
										disabled={interviewBusy || answerConfirming}
										onclick={() => submitInterviewAnswer('answered')}
									>
										<span>{interviewBusy ? 'Thinking...' : 'Save and continue'}</span><i
											aria-hidden="true">→</i
										>
									</button>
								</div>
							</article>
						{/if}

						{#if interviewMessage}
							<p class="intake-error" role="alert">{interviewMessage}</p>
						{/if}
						<div class="room-actions interview-room-actions">
							<div>
								{#if project.interview.status === 'active'}
									<button
										class="secondary-button"
										type="button"
										disabled={interviewBusy ||
											!currentQuestion ||
											project.interview.currentQuestionIndex === 0}
										onclick={previousInterviewQuestion}>← Previous question</button
									>
								{/if}
								<button
									class="secondary-button"
									type="button"
									disabled={interviewBusy || answerConfirming}
									onclick={goToResearch}>Research room</button
								>
							</div>
							{#if project.interview.status === 'active'}
								<button
									class="text-button"
									type="button"
									disabled={interviewBusy || answerConfirming}
									onclick={() => interviewDialog?.showModal()}>End interview early</button
								>
							{/if}
						</div>
					</section>
				{:else if project?.stage === 'concepts'}
					<ConceptRoom
						projectId={project.id}
						initialView={project.featureWorkshop.status === 'confirmed' ? 'features' : 'inbox'}
						prototypeBudgetUsd={project.preferences.prototypeBudgetUsd ?? 0}
						portfolio={project.concepts.portfolio}
						workshop={project.featureWorkshop}
						sources={project.research.result?.sources ?? []}
						muted={project.personality.muted}
						calm={project.personality.calmMode}
						busy={conceptBusy}
						paused={mainMenuOpen || pauseMenuOpen}
						workstationFallback={sageModelFallback}
						onWorkstationChange={(view) => (workstationView = view)}
						message={conceptMessage}
						onGenerate={() => requestConcepts(false)}
						onRegenerate={() => requestConcepts(true)}
						onBack={returnToQuestions}
						onContinue={enterFinalizationRoom}
						onReveal={reactToConceptReveal}
						onAllRevealed={reactToAllConcepts}
						onSkip={() => performSageEvent('concept-mail-skipped')}
						onTrash={() => performSageEvent('concept-trashed')}
						onWorkshopChange={updateFeatureWorkshop}
						onPerformanceChange={(performance) => (sagePerformance = performance)}
						onEffect={playOracleEffect}
					/>
				{:else}
					<section class="welcome-room" aria-labelledby="welcome-title">
						<div class="welcome-copy">
							<p class="room-number">THE IDEA WORKSHOP</p>
							<h1 id="welcome-title">Give that nagging problem somewhere to go.</h1>
							<p class="welcome-lede">
								The Signal Sage will research the territory, ask the annoying useful questions, and
								return four different projects worth considering.
							</p>
							<div class="promise-grid">
								<div>
									<span>01</span>
									<p>Describe related problems in your own words.</p>
								</div>
								<div>
									<span>02</span>
									<p>Compare three practical ideas and one stretch.</p>
								</div>
								<div>
									<span>03</span>
									<p>Export the chosen project as a cited PDF.</p>
								</div>
							</div>
							<div class="welcome-name-grid">
								<label>
									<span>What should the wizard call you? <small>optional</small></span>
									<input
										maxlength="50"
										bind:value={playerNameDraft}
										placeholder="Mortal, Evan, Captain..."
									/>
								</label>
								<label>
									<span>Working project name <small>optional and probably wrong</small></span>
									<input
										maxlength="50"
										bind:value={projectNameDraft}
										placeholder="Operation Mystery Box"
									/>
								</label>
							</div>
							<button class="summon-button" type="button" onclick={beginProject}>
								<span>Begin conjuring</span>
								<i aria-hidden="true">→</i>
							</button>
							<p class="time-note">No account. Your active project stays on this device.</p>
						</div>

						<div class="sage-card" aria-label="A message from the Signal Sage">
							<div class="speech-bubble">
								<span class="online-dot" aria-hidden="true"></span>
								I can guess your future project from its problems. Eventually. Probably.
							</div>
							<img src="/images/signal-sage.png" alt="" />
							<div class="sage-shadow" aria-hidden="true"></div>
						</div>
					</section>
				{/if}
			</main>
		</div>
	</div>

	<dialog class="reset-dialog" bind:this={resetDialog}>
		<form method="dialog">
			<p class="dialog-kicker">BREAK THE SPELL?</p>
			<h2>Start over completely?</h2>
			<p>This removes the active project from this browser. It cannot be restored.</p>
			<div class="dialog-actions">
				<button class="text-button" value="cancel">Keep it</button>
				<button class="danger-button" type="button" onclick={confirmStartOver}>Clear project</button
				>
			</div>
		</form>
	</dialog>

	<dialog class="reset-dialog" bind:this={interviewDialog}>
		<form method="dialog">
			<p class="dialog-kicker">ENOUGH QUESTIONS?</p>
			<h2>End the interview early?</h2>
			<p>
				You can continue to concepts, but the final package will mark its confidence as reduced.
			</p>
			<div class="dialog-actions">
				<button class="text-button" value="cancel">Keep answering</button>
				<button class="danger-button" type="button" onclick={finishInterviewEarly}
					>End interview</button
				>
			</div>
		</form>
	</dialog>
{/if}
