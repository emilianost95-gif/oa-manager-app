import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, ApiError } from '../lib/api';
import type {
  DashboardStats,
  LearningObjective,
  ObjectiveFiltersState,
  ObjectiveStatus,
  Paginated,
} from '../types';

export const EMPTY_FILTERS: ObjectiveFiltersState = {
  search: '',
  courseId: '',
  subjectId: '',
  unitId: '',
  status: [],
  priority: [],
  sort: 'order',
  direction: 'asc',
};

export function filtersToQuery(
  filters: ObjectiveFiltersState,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    search: filters.search || undefined,
    courseId: filters.courseId || undefined,
    subjectId: filters.subjectId || undefined,
    unitId: filters.unitId || undefined,
    status: filters.status.length ? filters.status : undefined,
    priority: filters.priority.length ? filters.priority : undefined,
    sort: filters.sort,
    direction: filters.direction,
    ...extra,
  };
}

export function countActiveFilters(filters: ObjectiveFiltersState): number {
  return (
    (filters.search ? 1 : 0) +
    (filters.courseId ? 1 : 0) +
    (filters.subjectId ? 1 : 0) +
    (filters.unitId ? 1 : 0) +
    filters.status.length +
    filters.priority.length
  );
}

const onError = (error: unknown) => {
  toast.error(
    error instanceof ApiError ? error.message : 'Ocurrió un problema. Inténtalo nuevamente.',
  );
};

export function useObjectives(filters: ObjectiveFiltersState, page = 1, pageSize = 200) {
  return useQuery({
    queryKey: ['objectives', filters, page, pageSize],
    queryFn: () =>
      api.get<Paginated<LearningObjective>>(
        '/objectives',
        filtersToQuery(filters, { page, pageSize }),
      ),
    placeholderData: (previous) => previous,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['stats', 'dashboard'],
    queryFn: () => api.get<DashboardStats>('/stats/dashboard'),
  });
}

export interface ObjectivePayload {
  code: string;
  title: string;
  description?: string | null;
  notes?: string | null;
  subjectId: string;
  courseId: string;
  unitId?: string | null;
  status: ObjectiveStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function useObjectiveMutations() {
  const qc = useQueryClient();

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['objectives'] });
    void qc.invalidateQueries({ queryKey: ['stats'] });
    void qc.invalidateQueries({ queryKey: ['subjects'] });
    void qc.invalidateQueries({ queryKey: ['units'] });
    void qc.invalidateQueries({ queryKey: ['courses'] });
  };

  const create = useMutation({
    mutationFn: (input: ObjectivePayload) => api.post<LearningObjective>('/objectives', input),
    onSuccess: () => {
      toast.success('Objetivo creado correctamente.');
      refresh();
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: ObjectivePayload & { id: string }) =>
      api.put<LearningObjective>(`/objectives/${id}`, input),
    onSuccess: () => {
      toast.success('Objetivo actualizado.');
      refresh();
    },
    onError,
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ObjectiveStatus }) =>
      api.patch<LearningObjective>(`/objectives/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Estado actualizado.');
      refresh();
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/objectives/${id}`),
    onSuccess: () => {
      toast.success('Objetivo eliminado.');
      refresh();
    },
    onError,
  });

  const reorder = useMutation({
    mutationFn: (ids: string[]) => api.put('/objectives/reorder', { ids }),
    onSuccess: () => {
      toast.success('Orden guardado.');
      void qc.invalidateQueries({ queryKey: ['objectives'] });
    },
    onError: (error) => {
      onError(error);
      void qc.invalidateQueries({ queryKey: ['objectives'] });
    },
  });

  return { create, update, changeStatus, remove, reorder };
}
