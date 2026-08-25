import { z } from 'zod';
import { priorityEnum, statusEnum } from './common.schema';

const nullableText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres.`)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null))
    .nullable();

export const objectiveCreateSchema = z.object({
  code: z
    .string({ required_error: 'El código del OA es obligatorio.' })
    .trim()
    .min(1, 'El código del OA es obligatorio.')
    .max(30, 'El código no puede superar los 30 caracteres.'),
  title: z
    .string({ required_error: 'El título es obligatorio.' })
    .trim()
    .min(3, 'El título debe tener al menos 3 caracteres.')
    .max(200, 'El título no puede superar los 200 caracteres.'),
  description: nullableText(2000, 'La descripción'),
  notes: nullableText(2000, 'Las observaciones'),
  subjectId: z.string({ required_error: 'Elige una asignatura.' }).uuid('Elige una asignatura.'),
  courseId: z.string({ required_error: 'Elige un curso.' }).uuid('Elige un curso.'),
  unitId: z
    .string()
    .uuid('Elige una unidad válida.')
    .nullable()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null)),
  status: statusEnum.default('PENDING'),
  priority: priorityEnum.default('MEDIUM'),
});

export const objectiveUpdateSchema = objectiveCreateSchema.partial();

export const objectiveStatusSchema = z.object({ status: statusEnum });

const csvList = <T extends z.ZodTypeAny>(inner: T) =>
  z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      const arr = Array.isArray(v) ? v : v.split(',');
      return arr.map((s) => s.trim()).filter(Boolean);
    })
    .pipe(z.array(inner).optional());

export const objectiveQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  courseId: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
  subjectId: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
  unitId: z.string().uuid().optional().or(z.literal('')).transform((v) => v || undefined),
  status: csvList(statusEnum),
  priority: csvList(priorityEnum),
  sort: z
    .enum(['order', 'code', 'title', 'status', 'priority', 'createdAt', 'updatedAt'])
    .default('order'),
  direction: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});

export type ObjectiveCreateInput = z.infer<typeof objectiveCreateSchema>;
export type ObjectiveUpdateInput = z.infer<typeof objectiveUpdateSchema>;
export type ObjectiveQuery = z.infer<typeof objectiveQuerySchema>;
