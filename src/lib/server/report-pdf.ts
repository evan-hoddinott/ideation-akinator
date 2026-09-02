import PDFDocument from 'pdfkit';
import { citationLabel, type ProjectReport } from '$lib/report';

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLORS = {
	ink: '#211b2b',
	muted: '#665d6e',
	purple: '#56336f',
	green: '#1c6b58',
	gold: '#b87816',
	pale: '#f5f0e8',
	line: '#d7ccd9',
	white: '#ffffff',
	black: '#0c0911',
	warning: '#9a3412'
};

interface PdfContext {
	doc: PDFKit.PDFDocument;
	sectionPages: Array<{ title: string; page: number }>;
}

export async function renderProjectPdf(report: ProjectReport): Promise<Buffer> {
	const doc = new PDFDocument({
		size: 'LETTER',
		margins: { top: 58, right: MARGIN, bottom: 58, left: MARGIN },
		bufferPages: true,
		info: {
			Title: `${report.productName} product brief`,
			Author: 'Ideation Akinator',
			Subject: 'Cited product requirements document',
			Keywords: 'product brief, PRD, research, requirements'
		}
	});
	const chunks: Buffer[] = [];
	doc.on('data', (chunk: Buffer) => chunks.push(chunk));
	const complete = new Promise<Buffer>((resolve, reject) => {
		doc.on('end', () => resolve(Buffer.concat(chunks)));
		doc.on('error', reject);
	});
	const context: PdfContext = { doc, sectionPages: [] };

	drawCover(context, report);
	doc.addPage();
	const tocPageIndex = doc.bufferedPageRange().count - 1;
	drawTocFrame(doc, report);
	doc.addPage();

	section(context, 'Executive summary');
	paragraph(doc, report.plan.executiveSummary);
	if (report.plan.materialWarning) warning(doc, 'Material warning', report.plan.materialWarning);
	keyValueGrid(doc, [
		['Prototype', moneyRange(report.plan.prototypeBudget)],
		['Timeline', report.plan.prototypeTimeline],
		['Difficulty', report.plan.technicalDifficulty],
		['Research verdict', report.focusedResearch.verdict]
	]);

	section(context, 'Problem definition');
	subheading(doc, report.topic);
	bullets(doc, report.problems);

	section(context, 'Target users');
	paragraph(doc, report.targetUser);
	if (report.interviewInsights.length) {
		subheading(doc, 'Confirmed interview inputs');
		for (const insight of report.interviewInsights) {
			keep(doc, 42);
			doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.purple).text(insight.question);
			doc.font('Helvetica').fontSize(10).fillColor(COLORS.ink).text(insight.answer, {
				paragraphGap: 8
			});
		}
	}

	section(context, 'Research summary');
	subheading(doc, 'Broad foothold');
	paragraph(doc, report.broadResearch.summary);
	for (const finding of report.broadResearch.findings) findingBlock(doc, finding);
	subheading(doc, 'Focused configured-project pass');
	verdictBlock(doc, report.focusedResearch.verdict, report.focusedResearch.verdictRationale);
	paragraph(doc, report.focusedResearch.summary);
	for (const finding of report.focusedResearch.findings) findingBlock(doc, finding);
	if (report.focusedResearch.gaps.length || report.broadResearch.gaps.length) {
		subheading(doc, 'Known research gaps');
		bullets(doc, [...report.broadResearch.gaps, ...report.focusedResearch.gaps]);
	}

	section(context, 'Selected product concept');
	bigQuote(doc, report.plan.oneLineSummary);
	paragraph(doc, report.concept.description);
	subheading(doc, 'Distinct approach');
	paragraph(doc, report.concept.distinctApproach);
	if (report.constraints.length) {
		subheading(doc, 'Build constraints');
		for (const constraint of report.constraints)
			labeledParagraph(doc, constraint.label, constraint.value);
	}

	section(context, 'Chosen features');
	for (const feature of report.plan.confirmedFeatures) {
		labeledParagraph(doc, `${feature.name} · ${feature.tier}`, feature.description);
	}

	section(context, 'Functional requirements');
	for (const requirement of report.plan.functionalRequirements) {
		keep(doc, 72);
		doc
			.font('Helvetica-Bold')
			.fontSize(11)
			.fillColor(COLORS.ink)
			.text(`${requirement.id}  ${requirement.name}`);
		paragraph(doc, requirement.description, 9.5);
		bullets(doc, requirement.acceptanceCriteria, 9);
	}

	section(context, 'Nonfunctional requirements');
	for (const requirement of report.plan.nonfunctionalRequirements) {
		keep(doc, 58);
		labeledParagraph(doc, requirement.category, requirement.requirement);
		doc
			.font('Helvetica-Oblique')
			.fontSize(9)
			.fillColor(COLORS.muted)
			.text(`Measure: ${requirement.measure}`, { paragraphGap: 8 });
	}

	section(context, 'Prototype plan and budget');
	keyValueGrid(doc, [
		['Estimated range', moneyRange(report.plan.prototypeBudget)],
		['Prototype timeline', report.plan.prototypeTimeline]
	]);
	subheading(doc, 'Estimate assumptions');
	bullets(doc, report.plan.prototypeBudget.assumptions);

	if (report.plan.productionBudget) {
		section(context, 'Production plan and budget');
		keyValueGrid(doc, [['Estimated range', moneyRange(report.plan.productionBudget)]]);
		subheading(doc, 'Estimate assumptions');
		bullets(doc, report.plan.productionBudget.assumptions);
	}

	section(context, 'Suggested technology');
	for (const recommendation of report.plan.technologyRecommendations) {
		labeledParagraph(
			doc,
			`${recommendation.area}: ${recommendation.choice}`,
			recommendation.rationale
		);
	}

	section(context, 'Hardware and manufacturing');
	if (report.plan.hardwareManufacturingRequirements.length) {
		bullets(doc, report.plan.hardwareManufacturingRequirements);
	} else {
		paragraph(
			doc,
			'No dedicated hardware or manufacturing work is required for this configuration.'
		);
	}

	section(context, 'Competitor comparison');
	drawCompetitorTable(doc, report.competitorRows);

	section(context, 'Differentiation and positioning');
	paragraph(doc, report.concept.distinctApproach);
	for (const row of report.competitorRows) {
		labeledParagraph(
			doc,
			`${row.name} ${citationLabel(row.sourceNumbers)}`.trim(),
			row.differentiation
		);
	}

	section(context, 'Risks and assumptions');
	for (const row of report.riskRows) {
		labeledParagraph(
			doc,
			`${row.risk} ${citationLabel(row.sourceNumbers)}`.trim(),
			`Mitigation: ${row.mitigation}`
		);
	}
	subheading(doc, 'Technical difficulty');
	paragraph(doc, `${report.plan.technicalDifficulty}: ${report.plan.technicalDifficultyRationale}`);

	section(context, 'Validation plan');
	for (const [index, step] of report.plan.validationSteps.entries()) {
		keep(doc, 76);
		doc
			.font('Helvetica-Bold')
			.fontSize(10)
			.fillColor(COLORS.purple)
			.text(`${index + 1}. ${step.hypothesis}`);
		paragraph(doc, `Method: ${step.method}`, 9.5);
		paragraph(doc, `Success signal: ${step.successSignal}`, 9.5);
	}

	section(context, 'High-level development phases');
	for (const [index, phase] of report.plan.developmentPhases.entries()) {
		keep(doc, 80);
		doc
			.font('Helvetica-Bold')
			.fontSize(11)
			.fillColor(COLORS.ink)
			.text(`${String(index + 1).padStart(2, '0')}  ${phase.name}`);
		paragraph(doc, phase.goal, 9.5);
		bullets(doc, phase.deliverables, 9);
	}

	section(context, 'Sources and citations');
	paragraph(
		doc,
		`Generated ${formatDate(report.generatedAt)}. Research retrieval dates appear with each source. ${report.demo ? 'This token-free demo uses illustrative sources and is not live research.' : 'Links were saved during research and may change after retrieval.'}`,
		9
	);
	for (const source of report.sources) sourceBlock(doc, source);

	drawToc(doc, tocPageIndex, report, context.sectionPages);
	drawPageFurniture(doc, report);
	doc.end();
	return complete;
}

function drawCover(context: PdfContext, report: ProjectReport) {
	const { doc } = context;
	doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill(COLORS.black);
	doc
		.rect(32, 32, PAGE_WIDTH - 64, PAGE_HEIGHT - 64)
		.lineWidth(2)
		.stroke(COLORS.gold);
	doc
		.rect(42, 42, PAGE_WIDTH - 84, PAGE_HEIGHT - 84)
		.lineWidth(0.6)
		.stroke('#7f6c92');
	doc
		.font('Courier-Bold')
		.fontSize(10)
		.fillColor('#8be8c5')
		.text('IDEATION AKINATOR // SEALED PROJECT FILE', 58, 72, { characterSpacing: 1.2 });
	doc
		.font('Helvetica-Bold')
		.fontSize(34)
		.fillColor(COLORS.white)
		.text(report.productName, 58, 178, { width: PAGE_WIDTH - 116, lineGap: 5 });
	doc
		.moveDown(0.7)
		.font('Helvetica')
		.fontSize(15)
		.fillColor('#e6dcea')
		.text(report.plan.oneLineSummary, { width: PAGE_WIDTH - 116, lineGap: 4 });
	doc
		.font('Courier-Bold')
		.fontSize(9)
		.fillColor('#f5cf78')
		.text(`RESEARCH VERDICT: ${report.focusedResearch.verdict.toUpperCase()}`, 58, 470);
	doc
		.font('Helvetica')
		.fontSize(10)
		.fillColor('#bfb3c8')
		.text(report.focusedResearch.verdictRationale, 58, 493, {
			width: PAGE_WIDTH - 116,
			lineGap: 3
		});
	doc
		.font('Courier')
		.fontSize(8)
		.fillColor('#8f8299')
		.text(`PROJECT ${report.projectId}  //  GENERATED ${formatDate(report.generatedAt)}`, 58, 672, {
			width: PAGE_WIDTH - 116
		});
	if (report.demo) {
		doc
			.roundedRect(58, 705, 252, 24, 3)
			.fillAndStroke('#442e16', '#d49c43')
			.font('Courier-Bold')
			.fontSize(8)
			.fillColor('#ffe0a1')
			.text('TOKEN-FREE DEMO · ILLUSTRATIVE EVIDENCE', 70, 713);
	}
}

function drawTocFrame(doc: PDFKit.PDFDocument, report: ProjectReport) {
	doc.font('Courier-Bold').fontSize(9).fillColor(COLORS.green).text('DOCUMENT MAP');
	doc
		.font('Helvetica-Bold')
		.fontSize(26)
		.fillColor(COLORS.ink)
		.text('Table of contents', MARGIN, 84);
	doc
		.font('Helvetica')
		.fontSize(9)
		.fillColor(COLORS.muted)
		.text(`${report.productName} · generated ${formatDate(report.generatedAt)}`, MARGIN, 122);
}

function drawToc(
	doc: PDFKit.PDFDocument,
	pageIndex: number,
	report: ProjectReport,
	entries: Array<{ title: string; page: number }>
) {
	doc.switchToPage(pageIndex);
	let y = 158;
	for (const [index, entry] of entries.entries()) {
		if (y > 714) break;
		doc
			.font('Courier-Bold')
			.fontSize(8)
			.fillColor(COLORS.gold)
			.text(String(index + 1).padStart(2, '0'), MARGIN, y, { width: 28 });
		doc
			.font('Helvetica')
			.fontSize(10)
			.fillColor(COLORS.ink)
			.text(entry.title, MARGIN + 34, y, { width: CONTENT_WIDTH - 74 });
		doc
			.font('Courier-Bold')
			.fillColor(COLORS.purple)
			.text(String(entry.page), PAGE_WIDTH - MARGIN - 34, y, { width: 34, align: 'right' });
		y += 28;
	}
	doc
		.font('Helvetica-Oblique')
		.fontSize(8)
		.fillColor(COLORS.muted)
		.text(
			report.demo
				? 'Demo report. The citations show document behavior, not live research.'
				: 'Citation numbers link research claims to the source ledger.',
			MARGIN,
			728,
			{ width: CONTENT_WIDTH }
		);
}

function section(context: PdfContext, title: string) {
	const { doc } = context;
	if (doc.y > 628) doc.addPage();
	context.sectionPages.push({ title, page: doc.bufferedPageRange().count });
	doc.moveDown(0.5);
	doc.rect(MARGIN, doc.y, 7, 24).fill(COLORS.green);
	doc
		.font('Helvetica-Bold')
		.fontSize(20)
		.fillColor(COLORS.ink)
		.text(title, MARGIN + 18, doc.y + 1, { width: CONTENT_WIDTH - 18 });
	doc.moveDown(0.85);
	doc
		.moveTo(MARGIN, doc.y)
		.lineTo(PAGE_WIDTH - MARGIN, doc.y)
		.strokeColor(COLORS.line)
		.stroke();
	doc.moveDown(0.7);
}

function subheading(doc: PDFKit.PDFDocument, text: string) {
	keep(doc, 38);
	doc.font('Helvetica-Bold').fontSize(12).fillColor(COLORS.purple).text(text, { paragraphGap: 7 });
}

function paragraph(doc: PDFKit.PDFDocument, text: string, size = 10.5) {
	doc
		.font('Helvetica')
		.fontSize(size)
		.fillColor(COLORS.ink)
		.text(text, { lineGap: 2.5, paragraphGap: 8 });
}

function labeledParagraph(doc: PDFKit.PDFDocument, label: string, text: string) {
	keep(doc, 48);
	doc.font('Helvetica-Bold').fontSize(10).fillColor(COLORS.ink).text(label, { paragraphGap: 3 });
	paragraph(doc, text, 9.5);
}

function bullets(doc: PDFKit.PDFDocument, items: string[], size = 9.5) {
	for (const item of items) {
		keep(doc, 26);
		doc
			.font('Helvetica')
			.fontSize(size)
			.fillColor(COLORS.ink)
			.text(`•  ${item}`, MARGIN + 8, doc.y, {
				width: CONTENT_WIDTH - 8,
				lineGap: 2,
				paragraphGap: 5
			});
	}
}

function findingBlock(
	doc: PDFKit.PDFDocument,
	finding: ProjectReport['broadResearch']['findings'][number]
) {
	keep(doc, 66);
	doc
		.font('Helvetica-Bold')
		.fontSize(10)
		.fillColor(COLORS.ink)
		.text(`${finding.title} ${citationLabel(finding.sourceNumbers)}`.trim());
	paragraph(doc, finding.claim, 9.5);
	if (finding.interpretation) {
		doc
			.font('Helvetica-Oblique')
			.fontSize(9)
			.fillColor(COLORS.muted)
			.text(`What it changes: ${finding.interpretation}`, { paragraphGap: 8 });
	}
}

function verdictBlock(
	doc: PDFKit.PDFDocument,
	verdict: ProjectReport['focusedResearch']['verdict'],
	rationale: string
) {
	keep(doc, 72);
	const y = doc.y;
	doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 58, 4).fill('#eee8f0');
	doc
		.font('Courier-Bold')
		.fontSize(9)
		.fillColor(verdict === 'weakened' ? COLORS.warning : COLORS.green)
		.text(verdict.toUpperCase(), MARGIN + 12, y + 10, { width: 100 });
	doc
		.font('Helvetica')
		.fontSize(9)
		.fillColor(COLORS.ink)
		.text(rationale, MARGIN + 112, y + 10, { width: CONTENT_WIDTH - 124, height: 42 });
	doc.y = y + 69;
}

function warning(doc: PDFKit.PDFDocument, title: string, text: string) {
	keep(doc, 78);
	const height = doc.heightOfString(text, { width: CONTENT_WIDTH - 28 }) + 42;
	const y = doc.y;
	doc.roundedRect(MARGIN, y, CONTENT_WIDTH, height, 4).fill('#fff2e8');
	doc
		.font('Helvetica-Bold')
		.fontSize(10)
		.fillColor(COLORS.warning)
		.text(title, MARGIN + 14, y + 12);
	doc
		.font('Helvetica')
		.fontSize(9.5)
		.fillColor(COLORS.ink)
		.text(text, MARGIN + 14, y + 29, {
			width: CONTENT_WIDTH - 28
		});
	doc.y = y + height + 10;
}

function bigQuote(doc: PDFKit.PDFDocument, text: string) {
	keep(doc, 80);
	doc
		.font('Helvetica-BoldOblique')
		.fontSize(16)
		.fillColor(COLORS.purple)
		.text(text, MARGIN + 18, doc.y, { width: CONTENT_WIDTH - 36, lineGap: 4, paragraphGap: 16 });
}

function keyValueGrid(doc: PDFKit.PDFDocument, values: Array<[string, string]>) {
	const width = (CONTENT_WIDTH - 10) / 2;
	for (let index = 0; index < values.length; index += 2) {
		keep(doc, 58);
		const y = doc.y;
		for (let column = 0; column < 2; column += 1) {
			const value = values[index + column];
			if (!value) continue;
			const x = MARGIN + column * (width + 10);
			doc.roundedRect(x, y, width, 48, 3).fill('#f1ecef');
			doc
				.font('Courier-Bold')
				.fontSize(7.5)
				.fillColor(COLORS.green)
				.text(value[0].toUpperCase(), x + 10, y + 8, {
					width: width - 20
				});
			doc
				.font('Helvetica-Bold')
				.fontSize(10)
				.fillColor(COLORS.ink)
				.text(value[1], x + 10, y + 23, {
					width: width - 20
				});
		}
		doc.y = y + 58;
	}
}

function drawCompetitorTable(doc: PDFKit.PDFDocument, rows: ProjectReport['competitorRows']) {
	const widths = [112, 168, 196];
	const header = () => {
		const y = doc.y;
		doc.rect(MARGIN, y, CONTENT_WIDTH, 24).fill(COLORS.purple);
		for (const [index, label] of ['Competitor', 'Overlap', 'Differentiation'].entries()) {
			const x = MARGIN + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
			doc
				.font('Helvetica-Bold')
				.fontSize(8)
				.fillColor(COLORS.white)
				.text(label, x + 6, y + 8, {
					width: widths[index] - 12
				});
		}
		doc.y = y + 24;
	};
	header();
	for (const row of rows) {
		const cells = [
			`${row.name}\n${row.type} ${citationLabel(row.sourceNumbers)}`,
			row.overlap,
			row.differentiation
		];
		const heights = cells.map((cell, index) =>
			doc.heightOfString(cell, { width: widths[index] - 12, lineGap: 1.5 })
		);
		const height = Math.max(44, Math.max(...heights) + 16);
		if (doc.y + height > PAGE_HEIGHT - 65) {
			doc.addPage();
			header();
		}
		const y = doc.y;
		doc.rect(MARGIN, y, CONTENT_WIDTH, height).fillAndStroke('#faf8f5', COLORS.line);
		for (const [index, cell] of cells.entries()) {
			const x = MARGIN + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
			if (index)
				doc
					.moveTo(x, y)
					.lineTo(x, y + height)
					.strokeColor(COLORS.line)
					.stroke();
			doc
				.font(index === 0 ? 'Helvetica-Bold' : 'Helvetica')
				.fontSize(8)
				.fillColor(COLORS.ink)
				.text(cell, x + 6, y + 8, {
					width: widths[index] - 12,
					height: height - 12,
					lineGap: 1.5
				});
		}
		doc.y = y + height;
	}
	doc.moveDown(0.8);
}

function sourceBlock(doc: PDFKit.PDFDocument, source: ProjectReport['sources'][number]) {
	keep(doc, 76);
	doc
		.font('Helvetica-Bold')
		.fontSize(9.5)
		.fillColor(COLORS.purple)
		.text(`[${source.number}] ${source.title}`, { link: source.url, underline: true });
	doc
		.font('Courier')
		.fontSize(7.5)
		.fillColor(COLORS.muted)
		.text(
			`${source.publisher || 'Publisher unknown'} · ${source.publicationDate ?? 'date unknown'} · retrieved ${formatDate(source.retrievedAt)} · ${source.stage} pass`
		);
	doc.font('Helvetica').fontSize(8.5).fillColor(COLORS.ink).text(source.evidenceSummary, {
		lineGap: 2,
		paragraphGap: 4
	});
	doc.font('Courier').fontSize(7).fillColor(COLORS.green).text(source.url, {
		link: source.url,
		underline: true,
		paragraphGap: 8
	});
}

function keep(doc: PDFKit.PDFDocument, height: number) {
	if (doc.y + height > PAGE_HEIGHT - 65) doc.addPage();
}

function drawPageFurniture(doc: PDFKit.PDFDocument, report: ProjectReport) {
	const range = doc.bufferedPageRange();
	for (let index = 0; index < range.count; index += 1) {
		doc.switchToPage(index);
		if (index === 0) continue;
		doc
			.font('Courier')
			.fontSize(7)
			.fillColor(COLORS.muted)
			.text('IDEATION AKINATOR', MARGIN, 31, { width: 160, lineBreak: false });
		doc
			.font('Courier')
			.fontSize(7)
			.fillColor(COLORS.muted)
			.text(report.productName, PAGE_WIDTH - MARGIN - 220, 31, {
				width: 220,
				align: 'right',
				lineBreak: false
			});
		doc
			.moveTo(MARGIN, 45)
			.lineTo(PAGE_WIDTH - MARGIN, 45)
			.strokeColor(COLORS.line)
			.stroke();
		doc
			.font('Courier')
			.fontSize(7)
			.fillColor(COLORS.muted)
			.text(`PAGE ${index + 1} / ${range.count}`, MARGIN, PAGE_HEIGHT - 38, {
				width: CONTENT_WIDTH,
				align: 'center',
				lineBreak: false
			});
	}
}

function moneyRange(range: ProjectReport['plan']['prototypeBudget']): string {
	const money = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
	return `${money.format(range.minimumUsd)} to ${money.format(range.maximumUsd)}`;
}

function formatDate(value: string): string {
	return new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		timeZone: 'UTC'
	}).format(new Date(value));
}
