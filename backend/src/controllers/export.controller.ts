import type { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { currentUserId } from '../middleware/auth';
import { validatedQuery } from '../middleware/validate';
import type { ObjectiveQuery } from '../schemas/objective.schema';
import { findObjectives, type ObjectiveWithRelations } from '../services/objective.service';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Logrado',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
};

const HEADERS = [
  'codigo',
  'titulo',
  'descripcion',
  'curso',
  'asignatura',
  'unidad',
  'prioridad',
  'estado',
  'observaciones',
];

function toRow(o: ObjectiveWithRelations): (string | number)[] {
  return [
    o.code,
    o.title,
    o.description ?? '',
    o.course.name,
    o.subject.name,
    o.unit?.name ?? '',
    PRIORITY_LABEL[o.priority] ?? o.priority,
    STATUS_LABEL[o.status] ?? o.status,
    o.notes ?? '',
  ];
}

function fileStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadFiltered(req: Request): Promise<ObjectiveWithRelations[]> {
  const userId = currentUserId(req);
  const query = validatedQuery<ObjectiveQuery>(req);
  const { items } = await findObjectives(userId, query, false);
  return items;
}

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportCsv(req: Request, res: Response): Promise<void> {
  const items = await loadFiltered(req);
  const lines = [HEADERS.join(','), ...items.map((o) => toRow(o).map(csvEscape).join(','))];

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="objetivos-${fileStamp()}.csv"`,
  );
  res.send('\uFEFF' + lines.join('\n'));
}

export async function exportXlsx(req: Request, res: Response): Promise<void> {
  const items = await loadFiltered(req);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Gestor de Objetivos de Aprendizaje';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Objetivos', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'codigo', key: 'codigo', width: 12 },
    { header: 'titulo', key: 'titulo', width: 46 },
    { header: 'descripcion', key: 'descripcion', width: 52 },
    { header: 'curso', key: 'curso', width: 16 },
    { header: 'asignatura', key: 'asignatura', width: 20 },
    { header: 'unidad', key: 'unidad', width: 26 },
    { header: 'prioridad', key: 'prioridad', width: 12 },
    { header: 'estado', key: 'estado', width: 14 },
    { header: 'observaciones', key: 'observaciones', width: 40 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' },
  };
  sheet.getRow(1).alignment = { vertical: 'middle' };
  sheet.getRow(1).height = 22;

  for (const o of items) {
    sheet.addRow(toRow(o));
  }

  sheet.autoFilter = { from: 'A1', to: 'I1' };
  sheet.eachRow((row, idx) => {
    if (idx === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
  });

  const summary = workbook.addWorksheet('Resumen');
  const total = items.length;
  const completed = items.filter((o) => o.status === 'COMPLETED').length;
  const inProgress = items.filter((o) => o.status === 'IN_PROGRESS').length;
  summary.columns = [
    { header: 'Indicador', key: 'k', width: 30 },
    { header: 'Valor', key: 'v', width: 16 },
  ];
  summary.getRow(1).font = { bold: true };
  summary.addRows([
    { k: 'Objetivos exportados', v: total },
    { k: 'Pendientes', v: total - completed - inProgress },
    { k: 'En proceso', v: inProgress },
    { k: 'Logrados', v: completed },
    { k: 'Progreso', v: total === 0 ? '0%' : `${Math.round((completed / total) * 100)}%` },
    { k: 'Generado', v: new Date().toLocaleString('es-CL') },
  ]);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="objetivos-${fileStamp()}.xlsx"`,
  );

  const buffer = await workbook.xlsx.writeBuffer();
  res.end(Buffer.from(buffer));
}

export async function exportPdf(req: Request, res: Response): Promise<void> {
  const items = await loadFiltered(req);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="objetivos-${fileStamp()}.pdf"`,
  );

  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
  doc.pipe(res);

  doc.fontSize(18).fillColor('#111827').text('Objetivos de Aprendizaje', { align: 'left' });
  doc
    .fontSize(9)
    .fillColor('#6b7280')
    .text(`Generado el ${new Date().toLocaleString('es-CL')} · ${items.length} objetivos`);
  doc.moveDown(0.8);

  const cols = [
    { label: 'Código', width: 55 },
    { label: 'Título', width: 200 },
    { label: 'Curso', width: 80 },
    { label: 'Asignatura', width: 95 },
    { label: 'Unidad', width: 130 },
    { label: 'Prioridad', width: 55 },
    { label: 'Estado', width: 65 },
  ];

  const startX = doc.page.margins.left;
  const drawHeader = (y: number) => {
    doc.rect(startX, y - 4, cols.reduce((a, c) => a + c.width, 0), 20).fill('#2563eb');
    let x = startX;
    doc.fillColor('#ffffff').fontSize(9);
    for (const c of cols) {
      doc.text(c.label, x + 4, y, { width: c.width - 8, ellipsis: true });
      x += c.width;
    }
    doc.fillColor('#111827');
    return y + 20;
  };

  let y = drawHeader(doc.y);

  for (const [i, o] of items.entries()) {
    if (y > doc.page.height - 60) {
      doc.addPage();
      y = drawHeader(doc.page.margins.top);
    }

    if (i % 2 === 1) {
      doc
        .rect(startX, y - 3, cols.reduce((a, c) => a + c.width, 0), 18)
        .fill('#f3f4f6')
        .fillColor('#111827');
    }

    const values = [
      o.code,
      o.title,
      o.course.name,
      o.subject.name,
      o.unit?.name ?? '—',
      PRIORITY_LABEL[o.priority] ?? o.priority,
      STATUS_LABEL[o.status] ?? o.status,
    ];

    let x = startX;
    doc.fontSize(8).fillColor('#111827');
    values.forEach((v, idx) => {
      doc.text(String(v), x + 4, y, {
        width: cols[idx].width - 8,
        height: 14,
        ellipsis: true,
        lineBreak: false,
      });
      x += cols[idx].width;
    });

    y += 18;
  }

  doc.end();
}
