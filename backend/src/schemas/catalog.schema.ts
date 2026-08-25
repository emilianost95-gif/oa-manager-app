import { z } from 'zod';

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres.`)
    .optional()
    .or(z.literal(''))
    .transform((v) => (v ? v : null))
    .nullable();

export const courseSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del curso es obligatorio.' })
    .trim()
    .min(1, 'El nombre del curso es obligatorio.')
    .max(80, 'El nombre no puede superar los 80 caracteres.'),
  description: optionalText(500, 'La descripción'),
});

export const courseUpdateSchema = courseSchema.partial();

export const subjectSchema = z.object({
  name: z
    .string({ required_error: 'El nombre de la asignatura es obligatorio.' })
    .trim()
    .min(1, 'El nombre de la asignatura es obligatorio.')
    .max(80, 'El nombre no puede superar los 80 caracteres.'),
  description: optionalText(500, 'La descripción'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'El color debe tener formato hexadecimal (#RRGGBB).')
    .optional(),
});

export const subjectUpdateSchema = subjectSchema.partial();

export const unitSchema = z.object({
  name: z
    .string({ required_error: 'El nombre de la unidad es obligatorio.' })
    .trim()
    .min(1, 'El nombre de la unidad es obligatorio.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),
  description: optionalText(500, 'La descripción'),
  subjectId: z.string({ required_error: 'Elige una asignatura.' }).uuid('Elige una asignatura.'),
  courseId: z.string({ required_error: 'Elige un curso.' }).uuid('Elige un curso.'),
});

export const unitUpdateSchema = unitSchema.partial();

export const unitQuerySchema = z.object({
  subjectId: z.string().uuid().optional(),
  courseId: z.string().uuid().optional(),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type UnitInput = z.infer<typeof unitSchema>;
