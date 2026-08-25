import { prisma } from '../lib/prisma';
import type { Prisma } from '../generated/prisma/client';
import type { ObjectiveQuery } from '../schemas/objective.schema';

export const objectiveInclude = {
  subject: { select: { id: true, name: true, color: true } },
  course: { select: { id: true, name: true } },
  unit: { select: { id: true, name: true } },
} satisfies Prisma.LearningObjectiveInclude;

export type ObjectiveWithRelations = Prisma.LearningObjectiveGetPayload<{
  include: typeof objectiveInclude;
}>;

/** Construye el `where` de Prisma a partir de los filtros de la UI. */
export function buildObjectiveWhere(
  userId: string,
  q: Partial<ObjectiveQuery>,
): Prisma.LearningObjectiveWhereInput {
  const where: Prisma.LearningObjectiveWhereInput = { userId };

  if (q.courseId) where.courseId = q.courseId;
  if (q.subjectId) where.subjectId = q.subjectId;
  if (q.unitId) where.unitId = q.unitId;
  if (q.status?.length) where.status = { in: q.status };
  if (q.priority?.length) where.priority = { in: q.priority };

  if (q.search) {
    where.OR = [
      { code: { contains: q.search, mode: 'insensitive' } },
      { title: { contains: q.search, mode: 'insensitive' } },
      { description: { contains: q.search, mode: 'insensitive' } },
      { notes: { contains: q.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export function buildObjectiveOrderBy(
  q: Pick<ObjectiveQuery, 'sort' | 'direction'>,
): Prisma.LearningObjectiveOrderByWithRelationInput[] {
  const dir = q.direction;
  switch (q.sort) {
    case 'code':
      return [{ code: dir }, { order: 'asc' }];
    case 'title':
      return [{ title: dir }, { order: 'asc' }];
    case 'status':
      return [{ status: dir }, { order: 'asc' }];
    case 'priority':
      return [{ priority: dir }, { order: 'asc' }];
    case 'createdAt':
      return [{ createdAt: dir }];
    case 'updatedAt':
      return [{ updatedAt: dir }];
    case 'order':
    default:
      return [{ order: dir }, { createdAt: 'asc' }];
  }
}

export async function findObjectives(
  userId: string,
  q: ObjectiveQuery,
  paginate = true,
): Promise<{ items: ObjectiveWithRelations[]; total: number }> {
  const where = buildObjectiveWhere(userId, q);
  const orderBy = buildObjectiveOrderBy(q);

  const [items, total] = await Promise.all([
    prisma.learningObjective.findMany({
      where,
      orderBy,
      include: objectiveInclude,
      ...(paginate ? { skip: (q.page - 1) * q.pageSize, take: q.pageSize } : {}),
    }),
    prisma.learningObjective.count({ where }),
  ]);

  return { items, total };
}
