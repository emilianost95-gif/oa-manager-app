import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { badRequest } from '../lib/errors';
import { currentUserId } from '../middleware/auth';
import {
  IMPORT_COLUMNS,
  parseImportFile,
  validateRow,
  type NormalizedRow,
  type ValidatedRow,
} from '../services/import.service';

const MAX_ROWS = 2000;

/** Paso 1: leer el archivo y devolver una vista previa validada. */
export async function previewImport(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const file = req.file;
  if (!file) throw badRequest('Selecciona un archivo CSV o Excel para importar.');

  const rawRows = await parseImportFile(file);

  if (rawRows.length === 0) {
    throw badRequest('El archivo no contiene filas con datos.');
  }
  if (rawRows.length > MAX_ROWS) {
    throw badRequest(`El archivo tiene ${rawRows.length} filas. El máximo permitido es ${MAX_ROWS}.`);
  }

  const detectedColumns = Object.keys(rawRows[0] ?? {});
  const missingColumns = (['codigo', 'titulo', 'curso', 'asignatura'] as const).filter(
    (c) => !detectedColumns.includes(c),
  );

  if (missingColumns.length > 0) {
    throw badRequest(
      `Faltan columnas obligatorias en el archivo: ${missingColumns.join(', ')}. ` +
        `Las columnas esperadas son: ${IMPORT_COLUMNS.join(', ')}.`,
    );
  }

  const rows: ValidatedRow[] = rawRows.map((raw, i) => validateRow(raw, i + 2));

  // Duplicados dentro del propio archivo
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (!row.data) continue;
    const key = `${row.data.codigo}|${row.data.asignatura}|${row.data.curso}`.toLowerCase();
    const first = seen.get(key);
    if (first) {
      row.warnings.push(`Duplicado dentro del archivo (ya aparece en la fila ${first}).`);
    } else {
      seen.set(key, row.rowNumber);
    }
  }

  // Duplicados contra lo ya guardado
  const codes = rows.map((r) => r.data?.codigo).filter(Boolean) as string[];
  if (codes.length > 0) {
    const existing = await prisma.learningObjective.findMany({
      where: { userId, code: { in: codes } },
      select: { code: true, subject: { select: { name: true } }, course: { select: { name: true } } },
    });
    const existingKeys = new Set(
      existing.map((e) => `${e.code}|${e.subject.name}|${e.course.name}`.toLowerCase()),
    );
    for (const row of rows) {
      if (!row.data) continue;
      const key = `${row.data.codigo}|${row.data.asignatura}|${row.data.curso}`.toLowerCase();
      if (existingKeys.has(key)) {
        row.warnings.push('Ya existe un objetivo con ese código en la misma asignatura y curso.');
        row.duplicate = true;
      }
    }
  }

  const newCourses = new Set<string>();
  const newSubjects = new Set<string>();
  const newUnits = new Set<string>();

  const [courses, subjects, units] = await Promise.all([
    prisma.course.findMany({ where: { userId }, select: { name: true } }),
    prisma.subject.findMany({ where: { userId }, select: { name: true } }),
    prisma.unit.findMany({
      where: { userId },
      select: { name: true, subject: { select: { name: true } }, course: { select: { name: true } } },
    }),
  ]);

  const courseNames = new Set(courses.map((c) => c.name.toLowerCase()));
  const subjectNames = new Set(subjects.map((s) => s.name.toLowerCase()));
  const unitKeys = new Set(
    units.map((u) => `${u.name}|${u.subject.name}|${u.course.name}`.toLowerCase()),
  );

  for (const row of rows) {
    if (!row.data) continue;
    if (!courseNames.has(row.data.curso.toLowerCase())) newCourses.add(row.data.curso);
    if (!subjectNames.has(row.data.asignatura.toLowerCase())) newSubjects.add(row.data.asignatura);
    if (row.data.unidad) {
      const key = `${row.data.unidad}|${row.data.asignatura}|${row.data.curso}`.toLowerCase();
      if (!unitKeys.has(key)) newUnits.add(`${row.data.unidad} (${row.data.asignatura} · ${row.data.curso})`);
    }
  }

  res.json({
    fileName: file.originalname,
    detectedColumns,
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((r) => r.valid).length,
      invalid: rows.filter((r) => !r.valid).length,
      duplicates: rows.filter((r) => r.duplicate).length,
      newCourses: [...newCourses],
      newSubjects: [...newSubjects],
      newUnits: [...newUnits],
    },
  });
}

const confirmSchema = z.object({
  skipDuplicates: z.boolean().default(true),
  rows: z
    .array(
      z.object({
        rowNumber: z.number().int(),
        codigo: z.string().trim().min(1).max(30),
        titulo: z.string().trim().min(3).max(200),
        descripcion: z.string().max(2000).nullable(),
        curso: z.string().trim().min(1).max(80),
        asignatura: z.string().trim().min(1).max(80),
        unidad: z.string().trim().max(120).nullable(),
        prioridad: z.enum(['LOW', 'MEDIUM', 'HIGH']),
        estado: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
        observaciones: z.string().max(2000).nullable(),
      }),
    )
    .min(1, 'No hay filas válidas para importar.')
    .max(MAX_ROWS),
});

export const importConfirmSchema = confirmSchema;

/** Paso 2: crear en PostgreSQL las filas confirmadas por la usuaria. */
export async function confirmImport(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { rows, skipDuplicates } = req.body as z.infer<typeof confirmSchema>;

  const result = await prisma.$transaction(async (tx) => {
    const courseCache = new Map<string, string>();
    const subjectCache = new Map<string, string>();
    const unitCache = new Map<string, string>();

    for (const c of await tx.course.findMany({ where: { userId } })) {
      courseCache.set(c.name.toLowerCase(), c.id);
    }
    for (const s of await tx.subject.findMany({ where: { userId } })) {
      subjectCache.set(s.name.toLowerCase(), s.id);
    }
    for (const u of await tx.unit.findMany({ where: { userId } })) {
      unitCache.set(`${u.name.toLowerCase()}|${u.subjectId}|${u.courseId}`, u.id);
    }

    let created = 0;
    let skipped = 0;
    const createdCourses: string[] = [];
    const createdSubjects: string[] = [];
    const createdUnits: string[] = [];

    let orderCursor =
      ((
        await tx.learningObjective.findFirst({
          where: { userId },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
      )?.order ?? -1) + 1;

    for (const row of rows as NormalizedRow[]) {
      let courseId = courseCache.get(row.curso.toLowerCase());
      if (!courseId) {
        const course = await tx.course.create({ data: { name: row.curso, userId } });
        courseId = course.id;
        courseCache.set(row.curso.toLowerCase(), courseId);
        createdCourses.push(row.curso);
      }

      let subjectId = subjectCache.get(row.asignatura.toLowerCase());
      if (!subjectId) {
        const subject = await tx.subject.create({ data: { name: row.asignatura, userId } });
        subjectId = subject.id;
        subjectCache.set(row.asignatura.toLowerCase(), subjectId);
        createdSubjects.push(row.asignatura);
      }

      let unitId: string | null = null;
      if (row.unidad) {
        const key = `${row.unidad.toLowerCase()}|${subjectId}|${courseId}`;
        unitId = unitCache.get(key) ?? null;
        if (!unitId) {
          const unit = await tx.unit.create({
            data: { name: row.unidad, subjectId, courseId, userId },
          });
          unitId = unit.id;
          unitCache.set(key, unitId);
          createdUnits.push(row.unidad);
        }
      }

      if (skipDuplicates) {
        const dup = await tx.learningObjective.findFirst({
          where: { userId, code: row.codigo, subjectId, courseId },
          select: { id: true },
        });
        if (dup) {
          skipped += 1;
          continue;
        }
      }

      await tx.learningObjective.create({
        data: {
          code: row.codigo,
          title: row.titulo,
          description: row.descripcion,
          notes: row.observaciones,
          status: row.estado,
          priority: row.prioridad,
          order: orderCursor++,
          userId,
          subjectId,
          courseId,
          unitId,
        },
      });
      created += 1;
    }

    return { created, skipped, createdCourses, createdSubjects, createdUnits };
  });

  res.status(201).json(result);
}

/** Plantilla CSV descargable con las columnas esperadas. */
export function downloadTemplate(_req: Request, res: Response): void {
  const rows = [
    IMPORT_COLUMNS.join(','),
    'OA1,Resolver problemas con números racionales,Aplicar operaciones básicas en contextos reales,1° Medio,Matemática,Unidad 1 — Números,alta,pendiente,Reforzar con guía de ejercicios',
    'OA2,Interpretar funciones lineales,Identificar pendiente e intercepto,1° Medio,Matemática,Unidad 2 — Álgebra,media,en proceso,',
  ];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="plantilla-objetivos.csv"');
  res.send('\uFEFF' + rows.join('\n'));
}
