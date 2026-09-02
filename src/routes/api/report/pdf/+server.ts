import { env } from '$env/dynamic/private';
import { parseProjectReport, safeReportFilename } from '$lib/report';
import { verifySessionToken } from '$lib/server/auth';
import { renderProjectPdf } from '$lib/server/report-pdf';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const SESSION_COOKIE = 'ideation_akinator_session';
const MAX_BODY_BYTES = 500_000;

export const POST: RequestHandler = async ({ cookies, request }) => {
	if (!verifySessionToken(cookies.get(SESSION_COOKIE), env.APP_COOKIE_SECRET ?? ''))
		return json(
			{ code: 'not_authenticated', message: 'Lock and reopen the workshop.' },
			{ status: 401 }
		);

	const length = Number(request.headers.get('content-length') ?? 0);
	if (Number.isFinite(length) && length > MAX_BODY_BYTES)
		return json(
			{ code: 'invalid_request', message: 'The finished project file is too large to forge.' },
			{ status: 413 }
		);

	let body: unknown;
	try {
		const raw = await request.text();
		if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new Error('too large');
		body = JSON.parse(raw);
	} catch {
		return json(
			{ code: 'invalid_request', message: 'The finished project file was not valid JSON.' },
			{ status: 400 }
		);
	}

	const report = parseProjectReport(body);
	if (!report)
		return json(
			{ code: 'invalid_request', message: 'Finish final recalculation before forging the PDF.' },
			{ status: 400 }
		);

	try {
		const pdf = await renderProjectPdf(report);
		console.info('pdf_generation completed', {
			projectId: report.projectId,
			pageBytes: pdf.byteLength,
			sourceCount: report.sources.length,
			demo: report.demo
		});
		return new Response(new Uint8Array(pdf), {
			headers: {
				'content-type': 'application/pdf',
				'content-disposition': `attachment; filename="${safeReportFilename(report.productName)}"`,
				'cache-control': 'no-store',
				'x-content-type-options': 'nosniff'
			}
		});
	} catch {
		console.warn('pdf_generation failed', { projectId: report.projectId });
		return json(
			{ code: 'pdf_failed', message: 'The PDF forge jammed. The browser report is still intact.' },
			{ status: 500 }
		);
	}
};
