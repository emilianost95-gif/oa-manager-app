import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { currentUserId } from '../middleware/auth';
import type { SubjectInput } from '../schemas/catalog.schema';
import type { ReorderInput } from '../schemas/common.schema';

async function assertOwnership(userId: string, id: string): Promise<void> {
  const found = await prisma.subject.findFirst({ where: { id, userId }, select: { id: true } });
  if (!found) throw notFound('No encontramos esa asignatura.');
}

export async function listSubjects(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);

  const subjects = await prisma.subject.findMany({
    where: { userId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { units: true, objectives: true } },
      objectives: { select: { status: true } },
    },
  });

  res.json(
    subjects.map((s) => {
      const completed = s.objectives.filter((o) => o.status === 'COMPLETED').length;
      const inProgress = s.objectives.filter((o) => o.status === 'IN_PROGRESS').length;
      const total = s.objectives.length;
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        color: s.color,
        order: s.order,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        unitCount: s._count.units,
        objectiveCount: s._count.objectives,
        completedCount: completed,
        inProgressCount: inProgress,
        pendingCount: total - completed - inProgress,
        progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      };
    }),
  );
}

/** Vista detallada de una asignatura: unidades con sus OA y progreso. */
export async function getSubjectDetail(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;

  const subject = await prisma.subject.findFirst({
    where: { id, userId },
    include: {
      units: {
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        include: {
          course: { select: { id: true, name: true } },
          objectives: {
            orderBy: [{ order: 'asc' }, { code: 'asc' }],
            include: { course: { select: { id: true, name: true } } },
          },
        },
      },
      objectives: { select: { id: true, status: true, courseId: true, unitId: true } },
      _count: { select: { units: true, objectives: true } },
    },
  });

  if (!subject) throw notFound('No encontramos esa asignatura.');

  const courses = await prisma.course.findMany({
    where: { userId, units: { some: { subjectId: id } } },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  });

  const total = subject.objectives.length;
  const completed = subject.objectives.filter((o) => o.status === 'COMPLETED').length;
  const inProgress = subject.objectives.filter((o) => o.status === 'IN_PROGRESS').length;

  const unassigned = subject.objectives.filter((o) => o.unitId === null).length;

  res.json({
    id: subject.id,
    name: subject.name,
    description: subject.description,
    color: subject.color,
    courses,
    stats: {
      total,
      completed,
      inProgress,
      pending: total - completed - inProgress,
      unitCount: subject._count.units,
      unassigned,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
    },
    units: subject.units.map((u) => {
      const uTotal = u.objectives.length;
      const uCompleted = u.objectives.filter((o) => o.status === 'COMPLETED').length;
      return {
        id: u.id,
        name: u.name,
        description: u.description,
        order: u.order,
        course: u.course,
        progress: uTotal === 0 ? 0 : Math.round((uCompleted / uTotal) * 100),
        objectiveCount: uTotal,
        completedCount: uCompleted,
        objectives: u.objectives.map((o) => ({
          id: o.id,
          code: o.code,
          title: o.title,
          status: o.status,
          priority: o.priority,
          course: o.course,
        })),
      };
    }),
  });
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const data = req.body as SubjectInput;

  const last = await prisma.subject.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const subject = await prisma.subject.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      color: data.color ?? '#2563eb',
      order: (last?.order ?? -1) + 1,
      userId,
    },
  });

  res.status(201).json(subject);
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  const data = req.body as Partial<SubjectInput>;
  const subject = await prisma.subject.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    },
  });

  res.json(subject);
}

export async function deleteSubject(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  await prisma.subject.delete({ where: { id } });
  res.json({ ok: true });
}

export async function reorderSubjects(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { ids } = req.body as ReorderInput;

  const owned = await prisma.subject.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  if (owned.length !== ids.length) throw notFound('Alguna de las asignaturas no existe.');

  await prisma.$transaction(
    ids.map((id, index) => prisma.subject.update({ where: { id }, data: { order: index } })),
  );

  res.json({ ok: true });
}
