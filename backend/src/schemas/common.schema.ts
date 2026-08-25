import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('Identificador inválido.'),
});

export const reorderSchema = z.object({
  ids: z
    .array(z.string().uuid('Identificador inválido.'))
    .min(1, 'Se necesita al menos un elemento para reordenar.'),
});

export const statusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
  errorMap: () => ({ message: 'El estado debe ser PENDING, IN_PROGRESS o COMPLETED.' }),
});

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH'], {
  errorMap: () => ({ message: 'La prioridad debe ser LOW, MEDIUM o HIGH.' }),
});

export type ReorderInput = z.infer<typeof reorderSchema>;
