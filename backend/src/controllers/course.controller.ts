import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { notFound } from '../lib/errors';
import { currentUserId } from '../middleware/auth';
import type { CourseInput } from '../schemas/catalog.schema';
import type { ReorderInput } from '../schemas/common.schema';

async function assertOwnership(userId: string, id: string): Promise<void> {
  const found = await prisma.course.findFirst({ where: { id, userId }, select: { id: true } });
  if (!found) throw notFound('No encontramos ese curso.');
}

export async function listCourses(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);

  const courses = await prisma.course.findMany({
    where: { userId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { units: true, objectives: true } } },
  });

  res.json(
    courses.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      order: c.order,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      unitCount: c._count.units,
      objectiveCount: c._count.objectives,
    })),
  );
}

export async function createCourse(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const data = req.body as CourseInput;

  const last = await prisma.course.findFirst({
    where: { userId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });

  const course = await prisma.course.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      order: (last?.order ?? -1) + 1,
      userId,
    },
  });

  res.status(201).json(course);
}

export async function updateCourse(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  const data = req.body as Partial<CourseInput>;
  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    },
  });

  res.json(course);
}

export async function deleteCourse(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { id } = req.params;
  await assertOwnership(userId, id);

  await prisma.course.delete({ where: { id } });
  res.json({ ok: true });
}

export async function reorderCourses(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);
  const { ids } = req.body as ReorderInput;

  const owned = await prisma.course.findMany({
    where: { id: { in: ids }, userId },
    select: { id: true },
  });
  if (owned.length !== ids.length) throw notFound('Alguno de los cursos no existe.');

  await prisma.$transaction(
    ids.map((id, index) => prisma.course.update({ where: { id }, data: { order: index } })),
  );

  res.json({ ok: true });
}
