import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { badRequest, notFound } from '../lib/errors';
import { currentUserId } from '../middleware/auth';
import { validatedQuery } from '../middleware/validate';
import type {
  ObjectiveCreateInput,
  ObjectiveQuery,
  ObjectiveUpdateInput,
} from '../schemas/objective.schema';
import type { ReorderInput } from '../schemas/common.schema';
import { findObjectives, objectiveInclude } from '../services/objective.service';

async function assertOwnership(userId: string, id: string): Promise<void> {
  const found = await prisma.learningObjective.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!found) throw notFound('No encontramos ese objetivo de aprendizaje.');
}

/**
 * Verifica que asignatura / curso / unidad pertenezcan a la usuaria y sean
 * coherentes entre sí (la unidad debe corresponder a esa asignatura y curso).
 */
async function assertRelations(
  userId: string,
  data: { subjectId?: string; courseId?: string; unitId?: string | null },
  fallback?: { subjectId: string; courseId: string },
): Promise<void> {
  const subjectId = data.subjectId ?? fallback?.subjectId;
  const courseId = data.courseId ?? fallback?.courseId;

  if (subjectId) {
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!subject) throw notFound('La asignatura seleccionada no existe.');
  }
  if (courseId) {
    const course = await prisma.course.findFirst({ where: { id: courseId, userId } });
    if (!course) throw notFound('El curso seleccionado no existe.');
  }
  if (data.unitId) {
    const unit = await prisma.unit.findFirst({ where: { id: data.unitId, userId } });
    if (!unit) throw notFound('La unidad seleccionada no existe.');
    if (subjectId && unit.subjectId !== subjectId) {
      throw badRequest('La unidad elegida pertenece a otra asignatura.');
    }
    if (courseId && unit.courseId !== courseId) {
      throw badRequest('La unidad elegida pertenece a otro curso.');
    }
  }
}

export async function listObjectives(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const query = validatedQuery<ObjectiveQuery>(req);

  const { items, total } = await findObjectives(userId, query);

  res.json({
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  });
}

export async function getObjective(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const objective = await prisma.learningObjective.findFirst({
    where: { id: req.params.id, userId },
    include: objectiveInclude,
  });
  if (!objective) throw notFound('No encontramos ese objetivo de aprendizaje.');
  res.json(objective);
}

export async function createObjective(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const data = req.body as ObjectiveCreateInput;

  await assertRelations(userId, data);

  const last = await prisma.learningObjective.findFirst({
    where: { userId, unitId: data.unitId ?? null },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const objective = await prisma.learningObjective.create({
    data: {
      code: data.code,
      title: data.title,
      description: data.description ?? null,
      notes: data.notes ?? null,
      status: data.status,
      priority: data.priority,
      subjectId: data.subjectId,
      courseId: data.courseId,
      unitId: data.unitId ?? null,
      order: (last?.order ?? -1) + 1,
      userId,
    },
    include: objectiveInclude,
  });

  res.status(201).json(objective);
}

export async function updateObjective(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;

  const existing = await prisma.learningObjective.findFirst({ where: { id, userId } });
  if (!existing) throw notFound('No encontramos ese objetivo de aprendizaje.');

  const data = req.body as ObjectiveUpdateInput;
  await assertRelations(userId, data, {
    subjectId: existing.subjectId,
    courseId: existing.courseId,
  });

  const objective = await prisma.learningObjective.update({
    where: { id },
    data: {
      ...(data.code !== undefined ? { code: data.code } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.subjectId !== undefined ? { subjectId: data.subjectId } : {}),
      ...(data.courseId !== undefined ? { courseId: data.courseId } : {}),
      ...(data.unitId !== undefined ? { unitId: data.unitId } : {}),
    },
    include: objectiveInclude,
  });

  res.json(objective);
}

export async function updateObjectiveStatus(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  const objective = await prisma.learningObjective.update({
    where: { id },
    data: { status: (req.body as { status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }).status },
    include: objectiveInclude,
  });

  res.json(objective);
}

export async function deleteObjective(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  await prisma.learningObjective.delete({ where: { id } });
  res.json({ ok: true });
}

/**
 * Persiste un nuevo orden. Recibe los ids en el orden deseado y guarda el
 * índice de cada uno dentro de una transacción.
 */
export async function reorderObjectives(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { ids } = req.body as ReorderInput;

  const owned = await prisma.learningObjective.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  if (owned.length !== ids.length) {
    throw notFound('Alguno de los objetivos ya no existe. Actualiza la página e intenta de nuevo.');
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.learningObjective.update({ where: { id }, data: { order: index } }),
    ),
  );

  res.json({ ok: true, count: ids.length });
}
