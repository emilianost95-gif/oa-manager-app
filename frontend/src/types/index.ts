export type ObjectiveStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type ObjectivePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  order: number;
  unitCount: number;
  objectiveCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string | null;
  color: string;
  order: number;
  unitCount: number;
  objectiveCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Unit {
  id: string;
  name: string;
  description: string | null;
  order: number;
  subjectId: string;
  courseId: string;
  subject: { id: string; name: string; color: string };
  course: { id: string; name: string };
  objectiveCount: number;
  completedCount: number;
  progress: number;
}

export interface LearningObjective {
  id: string;
  code: string;
  title: string;
  description: string | null;
  notes: string | null;
  order: number;
  status: ObjectiveStatus;
  priority: ObjectivePriority;
  subjectId: string;
  courseId: string;
  unitId: string | null;
  subject: { id: string; name: string; color: string };
  course: { id: string; name: string };
  unit: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totals: {
    objectives: number;
    pending: number;
    inProgress: number;
    completed: number;
    progress: number;
    subjects: number;
    units: number;
    courses: number;
  };
  byPriority: Record<ObjectivePriority, number>;
  bySubject: {
    id: string;
    name: string;
    color: string;
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    progress: number;
  }[];
  recent: LearningObjective[];
}

export interface SubjectDetail {
  id: string;
  name: string;
  description: string | null;
  color: string;
  courses: { id: string; name: string }[];
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    unitCount: number;
    unassigned: number;
    progress: number;
  };
  units: {
    id: string;
    name: string;
    description: string | null;
    order: number;
    course: { id: string; name: string };
    progress: number;
    objectiveCount: number;
    completedCount: number;
    objectives: {
      id: string;
      code: string;
      title: string;
      status: ObjectiveStatus;
      priority: ObjectivePriority;
      course: { id: string; name: string };
    }[];
  }[];
}

export interface ObjectiveFiltersState {
  search: string;
  courseId: string;
  subjectId: string;
  unitId: string;
  status: ObjectiveStatus[];
  priority: ObjectivePriority[];
  sort: 'order' | 'code' | 'title' | 'status' | 'priority' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface ImportIssue {
  field: string;
  message: string;
}

export interface ImportRowData {
  rowNumber: number;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  curso: string;
  asignatura: string;
  unidad: string | null;
  prioridad: ObjectivePriority;
  estado: ObjectiveStatus;
  observaciones: string | null;
}

export interface ImportRow {
  rowNumber: number;
  valid: boolean;
  issues: ImportIssue[];
  warnings: string[];
  duplicate?: boolean;
  data: ImportRowData | null;
  raw: Record<string, string>;
}

export interface ImportPreview {
  fileName: string;
  detectedColumns: string[];
  rows: ImportRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
    newCourses: string[];
    newSubjects: string[];
    newUnits: string[];
  };
}

export interface ImportResult {
  created: number;
  skipped: number;
  createdCourses: string[];
  createdSubjects: string[];
  createdUnits: string[];
}
