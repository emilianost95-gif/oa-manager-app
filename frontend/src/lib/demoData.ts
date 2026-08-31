import type { ObjectivePriority, ObjectiveStatus } from '../types';

/* -------------------------------------------------------------------------- */
/* Registros "crudos" del modo demo (equivalentes a las filas de PostgreSQL)   */
/* -------------------------------------------------------------------------- */

export interface DemoCourse {
  id: string;
  name: string;
  description: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DemoSubject extends DemoCourse {
  color: string;
}

export interface DemoUnit extends DemoCourse {
  subjectId: string;
  courseId: string;
}

export interface DemoObjective {
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
  createdAt: string;
  updatedAt: string;
}

export interface DemoState {
  courses: DemoCourse[];
  subjects: DemoSubject[];
  units: DemoUnit[];
  objectives: DemoObjective[];
}

/* -------------------------------------------------------------------------- */
/* Semilla ficticia                                                            */
/* -------------------------------------------------------------------------- */

/** Fecha relativa a hoy, para que la "actividad reciente" siempre se vea viva. */
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(9, 30, 0, 0);
  return date.toISOString();
}

interface SeedObjective {
  code: string;
  title: string;
  description?: string;
  notes?: string;
  subject: string;
  course: string;
  unit?: string;
  status: ObjectiveStatus;
  priority: ObjectivePriority;
  updated: number;
}

const COURSES: { key: string; name: string; description: string }[] = [
  { key: 'c1', name: '7° Básico', description: 'Séptimo año de enseñanza básica.' },
  { key: 'c2', name: '1° Medio', description: 'Primer año de enseñanza media, jornada mañana.' },
  { key: 'c3', name: '2° Medio', description: 'Segundo año de enseñanza media.' },
];

const SUBJECTS: { key: string; name: string; description: string; color: string }[] = [
  {
    key: 's1',
    name: 'Matemática',
    description: 'Pensamiento lógico, algebraico y análisis de datos.',
    color: '#2563eb',
  },
  {
    key: 's2',
    name: 'Lenguaje y Comunicación',
    description: 'Lectura, escritura y comunicación oral.',
    color: '#7c3aed',
  },
  {
    key: 's3',
    name: 'Ciencias Naturales',
    description: 'Indagación científica, biología, física y química.',
    color: '#059669',
  },
  {
    key: 's4',
    name: 'Historia y Geografía',
    description: 'Comprensión del mundo social y del entorno.',
    color: '#ea580c',
  },
];

const UNITS: { key: string; name: string; description: string; subject: string; course: string }[] =
  [
    {
      key: 'u1',
      name: 'Unidad 1 — Números enteros',
      description: 'Operatoria con enteros y resolución de problemas.',
      subject: 's1',
      course: 'c1',
    },
    {
      key: 'u2',
      name: 'Unidad 2 — Proporcionalidad',
      description: 'Razones, porcentajes y variación proporcional.',
      subject: 's1',
      course: 'c1',
    },
    {
      key: 'u3',
      name: 'Unidad 1 — Álgebra y funciones',
      description: 'Expresiones algebraicas y función lineal.',
      subject: 's1',
      course: 'c2',
    },
    {
      key: 'u4',
      name: 'Unidad 2 — Geometría',
      description: 'Área, volumen y transformaciones isométricas.',
      subject: 's1',
      course: 'c2',
    },
    {
      key: 'u5',
      name: 'Unidad 1 — Lectura literaria',
      description: 'Narrativa, poesía y análisis de textos.',
      subject: 's2',
      course: 'c2',
    },
    {
      key: 'u6',
      name: 'Unidad 2 — Escritura y argumentación',
      description: 'Producción de textos argumentativos.',
      subject: 's2',
      course: 'c2',
    },
    {
      key: 'u7',
      name: 'Unidad 1 — La célula',
      description: 'Estructura celular y procesos vitales.',
      subject: 's3',
      course: 'c1',
    },
    {
      key: 'u8',
      name: 'Unidad 2 — Energía y movimiento',
      description: 'Fuerzas, energía y sus transformaciones.',
      subject: 's3',
      course: 'c3',
    },
    {
      key: 'u9',
      name: 'Unidad 1 — Chile en el siglo XX',
      description: 'Procesos históricos y ciudadanía.',
      subject: 's4',
      course: 'c3',
    },
  ];

const OBJECTIVES: SeedObjective[] = [
  {
    code: 'OA1',
    title: 'Resolver problemas con números enteros',
    description: 'Aplicar suma, resta, multiplicación y división de enteros en contextos reales.',
    notes: 'Reforzar con guía de ejercicios en la clase 3.',
    subject: 's1',
    course: 'c1',
    unit: 'u1',
    status: 'COMPLETED',
    priority: 'HIGH',
    updated: 2,
  },
  {
    code: 'OA2',
    title: 'Representar enteros en la recta numérica',
    description: 'Ubicar, comparar y ordenar números enteros.',
    subject: 's1',
    course: 'c1',
    unit: 'u1',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    updated: 4,
  },
  {
    code: 'OA3',
    title: 'Aplicar porcentajes en situaciones cotidianas',
    description: 'Calcular descuentos, aumentos e interés simple.',
    notes: 'Conectar con la unidad de educación financiera.',
    subject: 's1',
    course: 'c1',
    unit: 'u2',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    updated: 1,
  },
  {
    code: 'OA4',
    title: 'Reconocer variación proporcional directa e inversa',
    subject: 's1',
    course: 'c1',
    unit: 'u2',
    status: 'PENDING',
    priority: 'MEDIUM',
    updated: 9,
  },
  {
    code: 'OA5',
    title: 'Operar con expresiones algebraicas',
    description: 'Reducir términos semejantes y factorizar expresiones simples.',
    subject: 's1',
    course: 'c2',
    unit: 'u3',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    updated: 3,
  },
  {
    code: 'OA6',
    title: 'Modelar situaciones con función lineal',
    description: 'Interpretar pendiente e intercepto en contextos reales.',
    notes: 'Evaluación formativa con Desmos.',
    subject: 's1',
    course: 'c2',
    unit: 'u3',
    status: 'PENDING',
    priority: 'MEDIUM',
    updated: 12,
  },
  {
    code: 'OA7',
    title: 'Calcular área y volumen de cuerpos geométricos',
    subject: 's1',
    course: 'c2',
    unit: 'u4',
    status: 'PENDING',
    priority: 'LOW',
    updated: 15,
  },
  {
    code: 'OA8',
    title: 'Aplicar transformaciones isométricas en el plano',
    description: 'Traslación, rotación y reflexión de figuras.',
    subject: 's1',
    course: 'c2',
    unit: 'u4',
    status: 'PENDING',
    priority: 'LOW',
    updated: 18,
  },
  {
    code: 'OA1',
    title: 'Analizar textos narrativos y poéticos',
    description: 'Identificar narrador, ambiente y recursos literarios.',
    notes: 'Lectura domiciliaria: "El lugar más bonito del mundo".',
    subject: 's2',
    course: 'c2',
    unit: 'u5',
    status: 'COMPLETED',
    priority: 'HIGH',
    updated: 5,
  },
  {
    code: 'OA2',
    title: 'Fundamentar interpretaciones con evidencia del texto',
    subject: 's2',
    course: 'c2',
    unit: 'u5',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    updated: 2,
  },
  {
    code: 'OA3',
    title: 'Escribir textos argumentativos con tesis clara',
    description: 'Planificar, redactar y revisar una columna de opinión.',
    notes: 'Rúbrica compartida con el departamento.',
    subject: 's2',
    course: 'c2',
    unit: 'u6',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    updated: 1,
  },
  {
    code: 'OA4',
    title: 'Participar en debates respetando turnos y argumentos',
    subject: 's2',
    course: 'c2',
    unit: 'u6',
    status: 'PENDING',
    priority: 'LOW',
    updated: 20,
  },
  {
    code: 'OA1',
    title: 'Explicar la estructura y función de la célula',
    description: 'Comparar célula animal y vegetal a partir de modelos.',
    subject: 's3',
    course: 'c1',
    unit: 'u7',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    updated: 7,
  },
  {
    code: 'OA2',
    title: 'Diseñar una investigación experimental sencilla',
    description: 'Formular hipótesis, variables y procedimiento.',
    notes: 'Trabajo en parejas, entrega en dos semanas.',
    subject: 's3',
    course: 'c1',
    unit: 'u7',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    updated: 3,
  },
  {
    code: 'OA3',
    title: 'Relacionar fuerza, energía y movimiento',
    subject: 's3',
    course: 'c3',
    unit: 'u8',
    status: 'PENDING',
    priority: 'MEDIUM',
    updated: 11,
  },
  {
    code: 'OA4',
    title: 'Evaluar el uso responsable de la energía en el hogar',
    description: 'Analizar consumo eléctrico y proponer mejoras.',
    subject: 's3',
    course: 'c3',
    unit: 'u8',
    status: 'PENDING',
    priority: 'LOW',
    updated: 22,
  },
  {
    code: 'OA1',
    title: 'Caracterizar los principales procesos de Chile en el siglo XX',
    description: 'Analizar continuidades y cambios políticos y sociales.',
    subject: 's4',
    course: 'c3',
    unit: 'u9',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    updated: 4,
  },
  {
    code: 'OA2',
    title: 'Interpretar fuentes históricas escritas y visuales',
    notes: 'Usar el archivo de Memoria Chilena.',
    subject: 's4',
    course: 'c3',
    unit: 'u9',
    status: 'PENDING',
    priority: 'MEDIUM',
    updated: 14,
  },
  {
    code: 'OA3',
    title: 'Reconocer derechos y deberes ciudadanos',
    subject: 's4',
    course: 'c3',
    status: 'PENDING',
    priority: 'LOW',
    updated: 25,
  },
  {
    code: 'OA9',
    title: 'Interpretar datos en tablas y gráficos',
    description: 'Leer, construir y comunicar información estadística.',
    subject: 's1',
    course: 'c3',
    status: 'PENDING',
    priority: 'MEDIUM',
    updated: 16,
  },
];

/** Genera una copia nueva del set de datos ficticios. */
export function createDemoState(): DemoState {
  const courseIds = new Map<string, string>();
  const subjectIds = new Map<string, string>();
  const unitIds = new Map<string, string>();

  const courses: DemoCourse[] = COURSES.map((course, index) => {
    const id = `demo-course-${index + 1}`;
    courseIds.set(course.key, id);
    return {
      id,
      name: course.name,
      description: course.description,
      order: index,
      createdAt: daysAgo(60),
      updatedAt: daysAgo(60),
    };
  });

  const subjects: DemoSubject[] = SUBJECTS.map((subject, index) => {
    const id = `demo-subject-${index + 1}`;
    subjectIds.set(subject.key, id);
    return {
      id,
      name: subject.name,
      description: subject.description,
      color: subject.color,
      order: index,
      createdAt: daysAgo(58),
      updatedAt: daysAgo(58),
    };
  });

  const units: DemoUnit[] = UNITS.map((unit, index) => {
    const id = `demo-unit-${index + 1}`;
    unitIds.set(unit.key, id);
    return {
      id,
      name: unit.name,
      description: unit.description,
      order: index,
      subjectId: subjectIds.get(unit.subject) as string,
      courseId: courseIds.get(unit.course) as string,
      createdAt: daysAgo(50),
      updatedAt: daysAgo(50),
    };
  });

  const objectives: DemoObjective[] = OBJECTIVES.map((objective, index) => ({
    id: `demo-objective-${index + 1}`,
    code: objective.code,
    title: objective.title,
    description: objective.description ?? null,
    notes: objective.notes ?? null,
    order: index,
    status: objective.status,
    priority: objective.priority,
    subjectId: subjectIds.get(objective.subject) as string,
    courseId: courseIds.get(objective.course) as string,
    unitId: objective.unit ? (unitIds.get(objective.unit) as string) : null,
    createdAt: daysAgo(45),
    updatedAt: daysAgo(objective.updated),
  }));

  return { courses, subjects, units, objectives };
}
