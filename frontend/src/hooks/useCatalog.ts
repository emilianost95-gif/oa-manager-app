import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, ApiError } from '../lib/api';
import type { Course, Subject, SubjectDetail, Unit } from '../types';

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: ['courses'] });
  void qc.invalidateQueries({ queryKey: ['subjects'] });
  void qc.invalidateQueries({ queryKey: ['units'] });
  void qc.invalidateQueries({ queryKey: ['objectives'] });
  void qc.invalidateQueries({ queryKey: ['stats'] });
};

const onError = (error: unknown) => {
  toast.error(error instanceof ApiError ? error.message : 'Ocurrió un problema. Inténtalo nuevamente.');
};

/* -------------------------------------------------------------------------- */
/* Cursos                                                                     */
/* -------------------------------------------------------------------------- */

export function useCourses() {
  return useQuery({ queryKey: ['courses'], queryFn: () => api.get<Course[]>('/courses') });
}

export function useCourseMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: { name: string; description?: string | null }) =>
      api.post<Course>('/courses', input),
    onSuccess: () => {
      toast.success('Curso creado correctamente.');
      invalidateAll(qc);
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: { id: string; name?: string; description?: string | null }) =>
      api.put<Course>(`/courses/${id}`, input),
    onSuccess: () => {
      toast.success('Curso actualizado.');
      invalidateAll(qc);
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success('Curso eliminado.');
      invalidateAll(qc);
    },
    onError,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.put('/courses/reorder', { ids }),
    onSuccess: () => {
      toast.success('Orden guardado.');
      void qc.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (error) => {
      onError(error);
      void qc.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  return { create, update, remove, reorder };
}

/* -------------------------------------------------------------------------- */
/* Asignaturas                                                                */
/* -------------------------------------------------------------------------- */

export function useSubjects() {
  return useQuery({ queryKey: ['subjects'], queryFn: () => api.get<Subject[]>('/subjects') });
}

export function useSubjectDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['subjects', id],
    queryFn: () => api.get<SubjectDetail>(`/subjects/${id}`),
    enabled: Boolean(id),
  });
}

export function useSubjectMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: { name: string; description?: string | null; color?: string }) =>
      api.post<Subject>('/subjects', input),
    onSuccess: () => {
      toast.success('Asignatura creada correctamente.');
      invalidateAll(qc);
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      description?: string | null;
      color?: string;
    }) => api.put<Subject>(`/subjects/${id}`, input),
    onSuccess: () => {
      toast.success('Asignatura actualizada.');
      invalidateAll(qc);
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/subjects/${id}`),
    onSuccess: () => {
      toast.success('Asignatura eliminada.');
      invalidateAll(qc);
    },
    onError,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.put('/subjects/reorder', { ids }),
    onSuccess: () => {
      toast.success('Orden guardado.');
      void qc.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error) => {
      onError(error);
      void qc.invalidateQueries({ queryKey: ['subjects'] });
    },
  });

  return { create, update, remove, reorder };
}

/* -------------------------------------------------------------------------- */
/* Unidades                                                                   */
/* -------------------------------------------------------------------------- */

export function useUnits(filters: { subjectId?: string; courseId?: string } = {}) {
  return useQuery({
    queryKey: ['units', filters],
    queryFn: () => api.get<Unit[]>('/units', filters),
  });
}

export function useUnitMutations() {
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: {
      name: string;
      description?: string | null;
      subjectId: string;
      courseId: string;
    }) => api.post<Unit>('/units', input),
    onSuccess: () => {
      toast.success('Unidad creada correctamente.');
      invalidateAll(qc);
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      description?: string | null;
      subjectId?: string;
      courseId?: string;
    }) => api.put<Unit>(`/units/${id}`, input),
    onSuccess: () => {
      toast.success('Unidad actualizada.');
      invalidateAll(qc);
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/units/${id}`),
    onSuccess: () => {
      toast.success('Unidad eliminada.');
      invalidateAll(qc);
    },
    onError,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.put('/units/reorder', { ids }),
    onSuccess: () => {
      toast.success('Orden guardado.');
      void qc.invalidateQueries({ queryKey: ['units'] });
      void qc.invalidateQueries({ queryKey: ['subjects'] });
    },
    onError: (error) => {
      onError(error);
      void qc.invalidateQueries({ queryKey: ['units'] });
    },
  });

  return { create, update, remove, reorder };
}
