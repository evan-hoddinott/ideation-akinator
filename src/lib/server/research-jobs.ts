import type {
	BroadResearchRequest,
	ResearchJobStatus,
	ResearchJobView,
	ResearchProgress
} from '$lib/research';
import {
	InvalidResearchResponseError,
	parseCompletedResearch,
	type ResearchProvider,
	type ResearchProviderSnapshot
} from '$lib/server/research-ai';
import { randomUUID } from 'node:crypto';
import type { TokenUsage } from '$lib/server/observability';

interface InternalResearchJob extends ResearchJobView {
	projectId: string;
	inputSignature: string;
	provider: ResearchProvider;
	providerResponseId: string | null;
	cancelRequested: boolean;
	requestId: string | null;
	model: string | null;
}

interface ResearchJobManagerOptions {
	now?: () => number;
	sleep?: (milliseconds: number) => Promise<void>;
	pollIntervalMs?: number;
	maximumRuntimeMs?: number;
	retentionMs?: number;
	idFactory?: () => string;
}

export class ResearchJobManager {
	private readonly jobs = new Map<string, InternalResearchJob>();
	private readonly now: () => number;
	private readonly sleep: (milliseconds: number) => Promise<void>;
	private readonly pollIntervalMs: number;
	private readonly maximumRuntimeMs: number;
	private readonly retentionMs: number;
	private readonly idFactory: () => string;

	constructor(options: ResearchJobManagerOptions = {}) {
		this.now = options.now ?? Date.now;
		this.sleep =
			options.sleep ??
			((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
		this.pollIntervalMs = options.pollIntervalMs ?? 1_500;
		this.maximumRuntimeMs = options.maximumRuntimeMs ?? 150_000;
		this.retentionMs = options.retentionMs ?? 30 * 60_000;
		this.idFactory = options.idFactory ?? randomUUID;
	}

	start(
		input: BroadResearchRequest,
		inputSignature: string,
		provider: ResearchProvider,
		logContext: { requestId?: string; model?: string } = {}
	): { job: ResearchJobView; reused: boolean } {
		this.cleanup();
		const existing = Array.from(this.jobs.values()).find(
			(job) =>
				job.projectId === input.projectId &&
				job.inputSignature === inputSignature &&
				(job.status === 'queued' || job.status === 'running')
		);
		if (existing) return { job: toView(existing), reused: true };

		const now = this.now();
		const job: InternalResearchJob = {
			id: this.idFactory(),
			projectId: input.projectId,
			inputSignature,
			status: 'queued',
			progress: 'queued',
			createdAt: new Date(now).toISOString(),
			updatedAt: new Date(now).toISOString(),
			expiresAt: new Date(now + this.retentionMs).toISOString(),
			message: null,
			result: null,
			tokenUsage: 0,
			provider,
			providerResponseId: null,
			cancelRequested: false,
			requestId: logContext.requestId ?? null,
			model: logContext.model ?? null
		};
		this.jobs.set(job.id, job);
		void this.run(job, input);
		return { job: toView(job), reused: false };
	}

	get(jobId: string): ResearchJobView | null {
		this.cleanup();
		const job = this.jobs.get(jobId);
		return job ? toView(job) : null;
	}

	async cancel(jobId: string): Promise<ResearchJobView | null> {
		this.cleanup();
		const job = this.jobs.get(jobId);
		if (!job) return null;
		if (isTerminal(job.status)) return toView(job);

		job.cancelRequested = true;
		this.update(job, 'cancelled', job.progress, 'Research cancelled. Your intake is still saved.');
		if (job.providerResponseId) {
			try {
				await job.provider.cancel(job.providerResponseId);
			} catch {
				// The local job remains cancelled even if the provider already reached a terminal state.
			}
		}
		return toView(job);
	}

	private async run(job: InternalResearchJob, input: BroadResearchRequest): Promise<void> {
		const startedAt = this.now();
		let usage: TokenUsage | null = null;
		for (let attempt = 0; attempt < 2; attempt += 1) {
			if (job.cancelRequested) return;
			this.update(job, 'running', attempt === 0 ? 'starting' : 'retrying-structure', null);
			try {
				let snapshot = await job.provider.start(input);
				usage = snapshot.usage ?? usage;
				job.tokenUsage = usage?.totalTokens ?? job.tokenUsage;
				job.providerResponseId = snapshot.id;
				this.update(job, 'running', 'researching', null);
				snapshot = await this.waitForTerminal(job, snapshot, startedAt);
				usage = snapshot.usage ?? usage;
				job.tokenUsage = usage?.totalTokens ?? job.tokenUsage;
				if (job.cancelRequested || snapshot.status === 'cancelled') {
					this.update(
						job,
						'cancelled',
						job.progress,
						'Research cancelled. Your intake is still saved.'
					);
					return;
				}
				if (snapshot.status !== 'completed') {
					throw new ProviderResearchError(snapshot.errorCode ?? snapshot.status);
				}

				this.update(job, 'running', 'checking-sources', null);
				const parsed = parseCompletedResearch(snapshot, new Date(this.now()));
				job.result = parsed.result;
				this.update(
					job,
					parsed.partial ? 'partial' : 'completed',
					'complete',
					parsed.partial
						? 'Research finished with useful findings and a few named gaps.'
						: 'Research finished with cited findings across the requested categories.'
				);
				console.info('broad_research completed', {
					requestId: job.requestId,
					jobId: job.id,
					durationMs: this.now() - startedAt,
					model: job.model,
					status: parsed.partial ? 'partial' : 'completed',
					sourceCount: parsed.result.sources.length,
					...(usage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 })
				});
				return;
			} catch (error) {
				if (job.cancelRequested) return;
				if (error instanceof InvalidResearchResponseError && attempt === 0) continue;
				const failureClass =
					error instanceof InvalidResearchResponseError
						? 'citation_contract_failed'
						: error instanceof ResearchTimeoutError
							? 'research_timeout'
							: 'provider_error';
				this.update(
					job,
					'failed',
					job.progress,
					failureClass === 'research_timeout'
						? 'The research ran past its time limit. You can start a fresh pass.'
						: 'The research could not produce a safely cited brief. Your intake is still saved.'
				);
				console.warn('broad_research failed', {
					requestId: job.requestId,
					jobId: job.id,
					durationMs: this.now() - startedAt,
					model: job.model,
					failureClass,
					reason: error instanceof Error ? error.message : 'Unknown research failure',
					...(usage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 })
				});
				return;
			}
		}
	}

	private async waitForTerminal(
		job: InternalResearchJob,
		initial: ResearchProviderSnapshot,
		startedAt: number
	): Promise<ResearchProviderSnapshot> {
		let snapshot = initial;
		while (snapshot.status === 'queued' || snapshot.status === 'in_progress') {
			if (job.cancelRequested) return snapshot;
			if (this.now() - startedAt > this.maximumRuntimeMs) {
				if (job.providerResponseId)
					await job.provider.cancel(job.providerResponseId).catch(() => undefined);
				throw new ResearchTimeoutError();
			}
			await this.sleep(this.pollIntervalMs);
			if (job.cancelRequested) return snapshot;
			snapshot = await job.provider.retrieve(snapshot.id);
		}
		return snapshot;
	}

	private update(
		job: InternalResearchJob,
		status: ResearchJobStatus,
		progress: ResearchProgress,
		message: string | null
	): void {
		job.status = status;
		job.progress = progress;
		job.message = message;
		job.updatedAt = new Date(this.now()).toISOString();
	}

	private cleanup(): void {
		const now = this.now();
		for (const [id, job] of this.jobs) {
			if (Date.parse(job.expiresAt) <= now) this.jobs.delete(id);
		}
	}
}

class ProviderResearchError extends Error {}
class ResearchTimeoutError extends Error {}

function isTerminal(status: ResearchJobStatus): boolean {
	return (
		status === 'completed' || status === 'partial' || status === 'failed' || status === 'cancelled'
	);
}

function toView(job: InternalResearchJob): ResearchJobView {
	return {
		id: job.id,
		status: job.status,
		progress: job.progress,
		createdAt: job.createdAt,
		updatedAt: job.updatedAt,
		expiresAt: job.expiresAt,
		message: job.message,
		result: job.result,
		tokenUsage: job.tokenUsage
	};
}

export const researchJobs = new ResearchJobManager();
