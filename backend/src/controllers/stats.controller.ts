import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { currentUserId } from '../middleware/auth';

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  const userId = currentUserId(req);

  const [byStatus, byPriority, subjectCount, unitCount, courseCount, recent, perSubject] =
    await Promise.all([
      prisma.learningObjective.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.learningObjective.groupBy({
        by: ['priority'],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.subject.count({ where: { userId } }),
      prisma.unit.count({ where: { userId } }),
      prisma.course.count({ where: { userId } }),
      prisma.learningObjective.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        include: {
          subject: { select: { id: true, name: true, color: true } },
          course: { select: { id: true, name: true } },
        },
      }),
      prisma.subject.findMany({
        where: { userId },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          color: true,
          objectives: { select: { status: true } },
        },
      }),
    ]);

  const countOf = (status: string) =>
    byStatus.find((s) => s.status === status)?._count._all ?? 0;

  const pending = countOf('PENDING');
  const inProgress = countOf('IN_PROGRESS');
  const completed = countOf('COMPLETED');
  const total = pending + inProgress + completed;

  res.json({
    totals: {
      objectives: total,
      pending,
      inProgress,
      completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100),
      subjects: subjectCount,
      units: unitCount,
      courses: courseCount,
    },
    byPriority: {
      LOW: byPriority.find((p) => p.priority === 'LOW')?._count._all ?? 0,
      MEDIUM: byPriority.find((p) => p.priority === 'MEDIUM')?._count._all ?? 0,
      HIGH: byPriority.find((p) => p.priority === 'HIGH')?._count._all ?? 0,
    },
    bySubject: perSubject.map((s) => {
      const t = s.objectives.length;
      const c = s.objectives.filter((o) => o.status === 'COMPLETED').length;
      const ip = s.objectives.filter((o) => o.status === 'IN_PROGRESS').length;
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        total: t,
        completed: c,
        inProgress: ip,
        pending: t - c - ip,
        progress: t === 0 ? 0 : Math.round((c / t) * 100),
      };
    }),
    recent,
  });
}
