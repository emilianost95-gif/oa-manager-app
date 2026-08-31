import { createDemoState, type DemoObjective, type DemoState } from './demoData';
import type {
  Course,
  DashboardStats,
  LearningObjective,
  ObjectivePriority,
  ObjectiveStatus,
  Paginated,
  Subject,
  SubjectDetail,
  Unit,
} from '../types';

/* -------------------------------------------------------------------------- */
/* Estado en memoria                                                          */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = 'oa-manager:demo-state';

let state: DemoState | null = null;

function persist(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* si no hay sessionStorage el modo demo sigue funcionando sólo en memoria */
  }
}

function db(): DemoState {
  if (state) return state;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved) as DemoState;
      return state;
    }
  } catch {
    /* datos corruptos o sin storage: se regenera la semilla */
  }
  state = createDemoState();
  persist();
  return state;
}

/** Vuelve a dejar los datos ficticios como estaban al entrar al modo demo. */
export function resetDemoData(): void {
  state = createDemoState();
  persist();
}

/** Borra por completo el set ficticio (al salir del modo demo). */
export function clearDemoData(): void {
  state = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nada que limpiar */
  }
}

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                  */
/* -------------------------------------------------------------------------- */

export interface DemoFailure {
  ok: false;
  status: number;
  code: string;
  message: string;
}

export type DemoResponse<T> = { ok: true; data: T } | DemoFailure;

class DemoHttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'ERROR',
  ) {
    super(message);
  }
}

const fail = (status: number, message: string, code = 'ERROR') => {
  throw new DemoHttpError(status, message, code);
};

const nowIso = () => new Date().toISOString();

let idCounter = 0;
const newId = (prefix: string) => `demo-${prefix}-new-${Date.now()}-${++idCounter}`;

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNullable(value: unknown): string | null {
  const text = asString(value);
  return text ? text : null;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value) return value.split(',');
  return [];
}

/** Rutas que el modo demo atiende localmente. El resto va al servidor real. */
export function isDemoPath(path: string): boolean {
  return /^\/(courses|subjects|units|objectives|stats|import|export)(\/|$|\?)/.test(path);
}

/* -------------------------------------------------------------------------- */
/* Serializadores (mismo contrato que el backend real)                        */
/* -------------------------------------------------------------------------- */

function serializeCourse(id: string): Course {
  const data = db();
  const course = data.courses.find((c) => c.id === id) as DemoState['courses'][number];
  return {
    id: course.id,
    name: course.name,
    description: course.description,
    order: course.order,
    unitCount: data.units.filter((u) => u.courseId === id).length,
    objectiveCount: data.objectives.filter((o) => o.courseId === id).length,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function serializeSubject(id: string): Subject {
  const data = db();
  const subject = data.subjects.find((s) => s.id === id) as DemoState['subjects'][number];
  const objectives = data.objectives.filter((o) => o.subjectId === id);
  const completed = objectives.filter((o) => o.status === 'COMPLETED').length;

  return {
    id: subject.id,
    name: subject.name,
    description: subject.description,
    color: subject.color,
    order: subject.order,
    unitCount: data.units.filter((u) => u.subjectId === id).length,
    objectiveCount: objectives.length,
    completedCount: completed,
    inProgressCount: objectives.filter((o) => o.status === 'IN_PROGRESS').length,
    pendingCount: objectives.filter((o) => o.status === 'PENDING').length,
    progress: objectives.length ? Math.round((completed / objectives.length) * 100) : 0,
    createdAt: subject.createdAt,
    updatedAt: subject.updatedAt,
  };
}

function serializeUnit(id: string): Unit {
  const data = db();
  const unit = data.units.find((u) => u.id === id) as DemoState['units'][number];
  const subject = data.subjects.find((s) => s.id === unit.subjectId);
  const course = data.courses.find((c) => c.id === unit.courseId);
  const objectives = data.objectives.filter((o) => o.unitId === id);
  const completed = objectives.filter((o) => o.status === 'COMPLETED').length;

  return {
    id: unit.id,
    name: unit.name,
    description: unit.description,
    order: unit.order,
    subjectId: unit.subjectId,
    courseId: unit.courseId,
    subject: {
      id: subject?.id ?? '',
      name: subject?.name ?? '',
      color: subject?.color ?? '#94a3b8',
    },
    course: { id: course?.id ?? '', name: course?.name ?? '' },
    objectiveCount: objectives.length,
    completedCount: completed,
    progress: objectives.length ? Math.round((completed / objectives.length) * 100) : 0,
  };
}

function serializeObjective(objective: DemoObjective): LearningObjective {
  const data = db();
  const subject = data.subjects.find((s) => s.id === objective.subjectId);
  const course = data.courses.find((c) => c.id === objective.courseId);
  const unit = objective.unitId ? data.units.find((u) => u.id === objective.unitId) : undefined;

  return {
    id: objective.id,
    code: objective.code,
    title: objective.title,
    description: objective.description,
    notes: objective.notes,
    order: objective.order,
    status: objective.status,
    priority: objective.priority,
    subjectId: objective.subjectId,
    courseId: objective.courseId,
    unitId: objective.unitId,
    subject: {
      id: subject?.id ?? '',
      name: subject?.name ?? '',
      color: subject?.color ?? '#94a3b8',
    },
    course: { id: course?.id ?? '', name: course?.name ?? '' },
    unit: unit ? { id: unit.id, name: unit.name } : null,
    createdAt: objective.createdAt,
    updatedAt: objective.updatedAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Reordenamiento                                                              */
/* -------------------------------------------------------------------------- */

function applyOrder<T extends { id: string; order: number }>(items: T[], ids: string[]): void {
  ids.forEach((id, index) => {
    const item = items.find((entry) => entry.id === id);
    if (item) item.order = index;
  });
}

/* -------------------------------------------------------------------------- */
/* Filtros de objetivos                                                        */
/* -------------------------------------------------------------------------- */

const PRIORITY_WEIGHT: Record<ObjectivePriority, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };
const STATUS_WEIGHT: Record<ObjectiveStatus, number> = {
  PENDING: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
};

function listObjectives(query: Record<string, unknown>): Paginated<LearningObjective> {
  const data = db();
  const search = asString(query.search).toLowerCase();
  const statuses = asList(query.status);
  const priorities = asList(query.priority);
  const courseId = asString(query.courseId);
  const subjectId = asString(query.subjectId);
  const unitId = asString(query.unitId);

  let items = data.objectives.filter((objective) => {
    if (courseId && objective.courseId !== courseId) return false;
    if (subjectId && objective.subjectId !== subjectId) return false;
    if (unitId && objective.unitId !== unitId) return false;
    if (statuses.length && !statuses.includes(objective.status)) return false;
    if (priorities.length && !priorities.includes(objective.priority)) return false;
    if (search) {
      const haystack = [
        objective.code,
        objective.title,
        objective.description ?? '',
        objective.notes ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sort = asString(query.sort) || 'order';
  const direction = asString(query.direction) === 'desc' ? -1 : 1;

  items = [...items].sort((a, b) => {
    let result = 0;
    switch (sort) {
      case 'code':
        result = a.code.localeCompare(b.code, 'es', { numeric: true });
        break;
      case 'title':
        result = a.title.localeCompare(b.title, 'es');
        break;
      case 'status':
        result = STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status];
        break;
      case 'priority':
        result = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
        break;
      case 'createdAt':
        result = a.createdAt.localeCompare(b.createdAt);
        break;
      case 'updatedAt':
        result = a.updatedAt.localeCompare(b.updatedAt);
        break;
      default:
        result = a.order - b.order;
    }
    return result * direction;
  });

  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.max(1, Number(query.pageSize) || 200);
  const total = items.length;

  return {
    items: items.slice((page - 1) * pageSize, page * pageSize).map(serializeObjective),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/* -------------------------------------------------------------------------- */
/* Dashboard y detalle de asignatura                                          */
/* -------------------------------------------------------------------------- */

function dashboardStats(): DashboardStats {
  const data = db();
  const objectives = data.objectives;
  const completed = objectives.filter((o) => o.status === 'COMPLETED').length;
  const inProgress = objectives.filter((o) => o.status === 'IN_PROGRESS').length;
  const pending = objectives.filter((o) => o.status === 'PENDING').length;

  return {
    totals: {
      objectives: objectives.length,
      pending,
      inProgress,
      completed,
      progress: objectives.length ? Math.round((completed / objectives.length) * 100) : 0,
      subjects: data.subjects.length,
      units: data.units.length,
      courses: data.courses.length,
    },
    byPriority: {
      LOW: objectives.filter((o) => o.priority === 'LOW').length,
      MEDIUM: objectives.filter((o) => o.priority === 'MEDIUM').length,
      HIGH: objectives.filter((o) => o.priority === 'HIGH').length,
    },
    bySubject: [...data.subjects]
      .sort((a, b) => a.order - b.order)
      .map((subject) => {
        const own = objectives.filter((o) => o.subjectId === subject.id);
        const done = own.filter((o) => o.status === 'COMPLETED').length;
        return {
          id: subject.id,
          name: subject.name,
          color: subject.color,
          total: own.length,
          completed: done,
          inProgress: own.filter((o) => o.status === 'IN_PROGRESS').length,
          pending: own.filter((o) => o.status === 'PENDING').length,
          progress: own.length ? Math.round((done / own.length) * 100) : 0,
        };
      }),
    recent: [...objectives]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 6)
      .map(serializeObjective),
  };
}

function subjectDetail(id: string): SubjectDetail {
  const data = db();
  const subject = data.subjects.find((s) => s.id === id);
  if (!subject) fail(404, 'No encontramos esa asignatura.', 'NOT_FOUND');

  const own = data.objectives.filter((o) => o.subjectId === id);
  const completed = own.filter((o) => o.status === 'COMPLETED').length;
  const units = data.units.filter((u) => u.subjectId === id).sort((a, b) => a.order - b.order);

  const courseIds = Array.from(new Set(own.map((o) => o.courseId)));

  return {
    id: subject!.id,
    name: subject!.name,
    description: subject!.description,
    color: subject!.color,
    courses: courseIds
      .map((courseId) => data.courses.find((c) => c.id === courseId))
      .filter((course): course is DemoState['courses'][number] => Boolean(course))
      .map((course) => ({ id: course.id, name: course.name })),
    stats: {
      total: own.length,
      completed,
      inProgress: own.filter((o) => o.status === 'IN_PROGRESS').length,
      pending: own.filter((o) => o.status === 'PENDING').length,
      unitCount: units.length,
      unassigned: own.filter((o) => !o.unitId).length,
      progress: own.length ? Math.round((completed / own.length) * 100) : 0,
    },
    units: units.map((unit) => {
      const unitObjectives = own
        .filter((o) => o.unitId === unit.id)
        .sort((a, b) => a.order - b.order);
      const unitCompleted = unitObjectives.filter((o) => o.status === 'COMPLETED').length;
      const course = data.courses.find((c) => c.id === unit.courseId);

      return {
        id: unit.id,
        name: unit.name,
        description: unit.description,
        order: unit.order,
        course: { id: course?.id ?? '', name: course?.name ?? '' },
        progress: unitObjectives.length
          ? Math.round((unitCompleted / unitObjectives.length) * 100)
          : 0,
        objectiveCount: unitObjectives.length,
        completedCount: unitCompleted,
        objectives: unitObjectives.map((objective) => ({
          id: objective.id,
          code: objective.code,
          title: objective.title,
          status: objective.status,
          priority: objective.priority,
          course: {
            id: objective.courseId,
            name: data.courses.find((c) => c.id === objective.courseId)?.name ?? '',
          },
        })),
      };
    }),
  };
}

/* -------------------------------------------------------------------------- */
/* Router                                                                      */
/* -------------------------------------------------------------------------- */

type Body = Record<string, unknown>;

function route(method: string, path: string, body: Body, query: Record<string, unknown>): unknown {
  const data = db();
  const segments = path.split('/').filter(Boolean);
  const [resource, second, third] = segments;

  /* ------------------------------ Importar/Exportar ---------------------- */
  if (resource === 'import' || resource === 'export') {
    fail(
      400,
      'Importar y exportar no están disponibles en el modo demo. Sal del modo demo para usarlos con tus datos reales.',
      'DEMO_UNSUPPORTED',
    );
  }

  /* --------------------------------- Stats ------------------------------- */
  if (resource === 'stats') return dashboardStats();

  /* -------------------------------- Cursos ------------------------------- */
  if (resource === 'courses') {
    if (method === 'GET' && !second) {
      return [...data.courses].sort((a, b) => a.order - b.order).map((c) => serializeCourse(c.id));
    }
    if (method === 'POST') {
      const name = asString(body.name);
      if (!name) fail(422, 'El nombre del curso es obligatorio.', 'VALIDATION_ERROR');
      if (data.courses.some((c) => c.name.toLowerCase() === name.toLowerCase()))
        fail(409, 'Ya existe un curso con ese nombre.', 'CONFLICT');

      const course = {
        id: newId('course'),
        name,
        description: asNullable(body.description),
        order: data.courses.length,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.courses.push(course);
      persist();
      return serializeCourse(course.id);
    }
    if (method === 'PUT' && second === 'reorder') {
      applyOrder(data.courses, asList(body.ids));
      persist();
      return { ok: true };
    }
    if (method === 'PUT' && second) {
      const course = data.courses.find((c) => c.id === second);
      if (!course) fail(404, 'No encontramos ese curso.', 'NOT_FOUND');
      if (body.name !== undefined) course!.name = asString(body.name) || course!.name;
      if (body.description !== undefined) course!.description = asNullable(body.description);
      course!.updatedAt = nowIso();
      persist();
      return serializeCourse(course!.id);
    }
    if (method === 'DELETE' && second) {
      data.objectives = data.objectives.filter((o) => o.courseId !== second);
      data.units = data.units.filter((u) => u.courseId !== second);
      data.courses = data.courses.filter((c) => c.id !== second);
      persist();
      return undefined;
    }
  }

  /* ----------------------------- Asignaturas ----------------------------- */
  if (resource === 'subjects') {
    if (method === 'GET' && !second) {
      return [...data.subjects].sort((a, b) => a.order - b.order).map((s) => serializeSubject(s.id));
    }
    if (method === 'GET' && second) return subjectDetail(second);
    if (method === 'POST') {
      const name = asString(body.name);
      if (!name) fail(422, 'El nombre de la asignatura es obligatorio.', 'VALIDATION_ERROR');
      if (data.subjects.some((s) => s.name.toLowerCase() === name.toLowerCase()))
        fail(409, 'Ya existe una asignatura con ese nombre.', 'CONFLICT');

      const subject = {
        id: newId('subject'),
        name,
        description: asNullable(body.description),
        color: asString(body.color) || '#2563eb',
        order: data.subjects.length,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.subjects.push(subject);
      persist();
      return serializeSubject(subject.id);
    }
    if (method === 'PUT' && second === 'reorder') {
      applyOrder(data.subjects, asList(body.ids));
      persist();
      return { ok: true };
    }
    if (method === 'PUT' && second) {
      const subject = data.subjects.find((s) => s.id === second);
      if (!subject) fail(404, 'No encontramos esa asignatura.', 'NOT_FOUND');
      if (body.name !== undefined) subject!.name = asString(body.name) || subject!.name;
      if (body.description !== undefined) subject!.description = asNullable(body.description);
      if (body.color !== undefined) subject!.color = asString(body.color) || subject!.color;
      subject!.updatedAt = nowIso();
      persist();
      return serializeSubject(subject!.id);
    }
    if (method === 'DELETE' && second) {
      data.objectives = data.objectives.filter((o) => o.subjectId !== second);
      data.units = data.units.filter((u) => u.subjectId !== second);
      data.subjects = data.subjects.filter((s) => s.id !== second);
      persist();
      return undefined;
    }
  }

  /* -------------------------------- Unidades ----------------------------- */
  if (resource === 'units') {
    if (method === 'GET' && !second) {
      const subjectId = asString(query.subjectId);
      const courseId = asString(query.courseId);
      return data.units
        .filter((u) => (!subjectId || u.subjectId === subjectId) && (!courseId || u.courseId === courseId))
        .sort((a, b) => a.order - b.order)
        .map((u) => serializeUnit(u.id));
    }
    if (method === 'POST') {
      const name = asString(body.name);
      const subjectId = asString(body.subjectId);
      const courseId = asString(body.courseId);
      if (!name) fail(422, 'El nombre de la unidad es obligatorio.', 'VALIDATION_ERROR');
      if (!subjectId || !courseId)
        fail(422, 'La unidad necesita una asignatura y un curso.', 'VALIDATION_ERROR');
      if (
        data.units.some(
          (u) =>
            u.subjectId === subjectId &&
            u.courseId === courseId &&
            u.name.toLowerCase() === name.toLowerCase(),
        )
      )
        fail(409, 'Ya existe una unidad con ese nombre en esa asignatura y curso.', 'CONFLICT');

      const unit = {
        id: newId('unit'),
        name,
        description: asNullable(body.description),
        order: data.units.length,
        subjectId,
        courseId,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.units.push(unit);
      persist();
      return serializeUnit(unit.id);
    }
    if (method === 'PUT' && second === 'reorder') {
      applyOrder(data.units, asList(body.ids));
      persist();
      return { ok: true };
    }
    if (method === 'PUT' && second) {
      const unit = data.units.find((u) => u.id === second);
      if (!unit) fail(404, 'No encontramos esa unidad.', 'NOT_FOUND');
      if (body.name !== undefined) unit!.name = asString(body.name) || unit!.name;
      if (body.description !== undefined) unit!.description = asNullable(body.description);
      if (body.subjectId !== undefined) unit!.subjectId = asString(body.subjectId) || unit!.subjectId;
      if (body.courseId !== undefined) unit!.courseId = asString(body.courseId) || unit!.courseId;
      unit!.updatedAt = nowIso();
      persist();
      return serializeUnit(unit!.id);
    }
    if (method === 'DELETE' && second) {
      data.objectives = data.objectives.map((o) =>
        o.unitId === second ? { ...o, unitId: null } : o,
      );
      data.units = data.units.filter((u) => u.id !== second);
      persist();
      return undefined;
    }
  }

  /* ------------------------------- Objetivos ----------------------------- */
  if (resource === 'objectives') {
    if (method === 'GET' && !second) return listObjectives(query);
    if (method === 'POST') {
      const code = asString(body.code);
      const title = asString(body.title);
      if (!code) fail(422, 'El código del OA es obligatorio.', 'VALIDATION_ERROR');
      if (title.length < 3) fail(422, 'El título debe tener al menos 3 caracteres.', 'VALIDATION_ERROR');

      const objective: DemoObjective = {
        id: newId('objective'),
        code,
        title,
        description: asNullable(body.description),
        notes: asNullable(body.notes),
        order: data.objectives.length,
        status: (asString(body.status) || 'PENDING') as ObjectiveStatus,
        priority: (asString(body.priority) || 'MEDIUM') as ObjectivePriority,
        subjectId: asString(body.subjectId),
        courseId: asString(body.courseId),
        unitId: asNullable(body.unitId),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.objectives.push(objective);
      persist();
      return serializeObjective(objective);
    }
    if (method === 'PUT' && second === 'reorder') {
      applyOrder(data.objectives, asList(body.ids));
      persist();
      return { ok: true };
    }
    if (method === 'PATCH' && second && third === 'status') {
      const objective = data.objectives.find((o) => o.id === second);
      if (!objective) fail(404, 'No encontramos ese objetivo.', 'NOT_FOUND');
      objective!.status = asString(body.status) as ObjectiveStatus;
      objective!.updatedAt = nowIso();
      persist();
      return serializeObjective(objective!);
    }
    if (method === 'PUT' && second) {
      const objective = data.objectives.find((o) => o.id === second);
      if (!objective) fail(404, 'No encontramos ese objetivo.', 'NOT_FOUND');
      if (body.code !== undefined) objective!.code = asString(body.code) || objective!.code;
      if (body.title !== undefined) objective!.title = asString(body.title) || objective!.title;
      if (body.description !== undefined) objective!.description = asNullable(body.description);
      if (body.notes !== undefined) objective!.notes = asNullable(body.notes);
      if (body.subjectId !== undefined)
        objective!.subjectId = asString(body.subjectId) || objective!.subjectId;
      if (body.courseId !== undefined)
        objective!.courseId = asString(body.courseId) || objective!.courseId;
      if (body.unitId !== undefined) objective!.unitId = asNullable(body.unitId);
      if (body.status !== undefined) objective!.status = asString(body.status) as ObjectiveStatus;
      if (body.priority !== undefined)
        objective!.priority = asString(body.priority) as ObjectivePriority;
      objective!.updatedAt = nowIso();
      persist();
      return serializeObjective(objective!);
    }
    if (method === 'DELETE' && second) {
      data.objectives = data.objectives.filter((o) => o.id !== second);
      persist();
      return undefined;
    }
  }

  return fail(404, 'Esa acción no está disponible en el modo demo.', 'DEMO_UNSUPPORTED');
}

/**
 * Atiende una petición como lo haría el backend, pero contra los datos
 * ficticios en memoria. Nunca toca la base de datos real.
 */
export async function handleDemoRequest<T>(
  method: string,
  path: string,
  body: unknown,
  query: Record<string, unknown> = {},
): Promise<DemoResponse<T>> {
  // Pequeña latencia simulada para que se vean los estados de carga.
  await new Promise((resolve) => setTimeout(resolve, 90));

  if (body instanceof FormData) {
    return {
      ok: false,
      status: 400,
      code: 'DEMO_UNSUPPORTED',
      message:
        'Importar archivos no está disponible en el modo demo. Sal del modo demo para usarlo con tus datos reales.',
    };
  }

  try {
    const cleanPath = path.split('?')[0];
    const payload = (body ?? {}) as Body;
    return { ok: true, data: route(method.toUpperCase(), cleanPath, payload, query) as T };
  } catch (error) {
    if (error instanceof DemoHttpError) {
      return { ok: false, status: error.status, code: error.code, message: error.message };
    }
    return {
      ok: false,
      status: 500,
      code: 'DEMO_ERROR',
      message: 'Ocurrió un problema en el modo demo. Inténtalo nuevamente.',
    };
  }
}
