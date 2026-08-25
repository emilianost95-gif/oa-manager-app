import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { currentUserId } from '../middleware/auth';
import type { UnitInput } from '../schemas/catalog.schema';
import type { ReorderInput } from '../schemas/common.schema';
import { validatedQuery } from '../middleware/validate';

async function assertOwnership(userId: string, id: string): Promise<void> {
  const found = await prisma.unit.findFirst({ where: { id, userId }, select: { id: true } });
  if (!found) throw notFound('No encontramos esa unidad.');
}

async function assertRelations(
  userId: string,
  subjectId?: string,
  courseId?: string,
): Promise<void> {
  if (subjectId) {
    const s = await prisma.subject.findFirst({ where: { id: subjectId, userId } });
    if (!s) throw notFound('La asignatura seleccionada no existe.');
  }
  if (courseId) {
    const c = await prisma.course.findFirst({ where: { id: courseId, userId } });
    if (!c) throw notFound('El curso seleccionado no existe.');
  }
}

export async function listUnits(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const filters = validatedQuery<{ subjectId?: string; courseId?: string }>(req) ?? {};

  const units = await prisma.unit.findMany({
    where: {
      userId,
      ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      subject: { select: { id: true, name: true, color: true } },
      course: { select: { id: true, name: true } },
      objectives: { select: { status: true } },
    },
  });

  res.json(
    units.map((u) => {
      const total = u.objectives.length;
      const completed = u.objectives.filter((o) => o.status === 'COMPLETED').length;
      return {
        id: u.id,
        name: u.name,
        description: u.description,
        order: u.order,
        subjectId: u.subjectId,
        courseId: u.courseId,
        subject: u.subject,
        course: u.course,
        objectiveCount: total,
        completedCount: completed,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    }),
  );
}

export async function createUnit(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const data = req.body as UnitInput;

  await assertRelations(userId, data.subjectId, data.courseId);

  const last = await prisma.unit.findFirst({
    where: { userId, subjectId: data.subjectId, courseId: data.courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const unit = await prisma.unit.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      subjectId: data.subjectId,
      courseId: data.courseId,
      order: (last?.order ?? -1) + 1,
      userId,
    },
  });

  res.status(201).json(unit);
}

export async function updateUnit(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  const data = req.body as Partial<UnitInput>;
  await assertRelations(userId, data.subjectId, data.courseId);

  const unit = await prisma.unit.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.subjectId !== undefined ? { subjectId: data.subjectId } : {}),
      ...(data.courseId !== undefined ? { courseId: data.courseId } : {}),
    },
  });

  res.json(unit);
}

export async function deleteUnit(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  await prisma.unit.delete({ where: { id } });
  res.json({ ok: true });
}

export async function reorderUnits(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { ids } = req.body as ReorderInput;

  const owned = await prisma.unit.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  if (owned.length !== ids.length) throw notFound('Alguna de las unidades no existe.');

  await prisma.$transaction(
    ids.map((id, index) => prisma.unit.update({ where: { id }, data: { order: index } })),
  );

  res.json({ ok: true });
}
