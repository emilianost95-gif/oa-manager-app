import type { HelpContent } from '../components/ui/HelpTip';

/**
 * Textos de la ayuda contextual (iconos ⓘ), centralizados para mantener un
 * mismo tono en toda la aplicación: qué es el campo, qué escribir y un ejemplo.
 */
export const HELP: Record<string, HelpContent> = {
  /* ------------------------------- Objetivos ------------------------------ */
  objectiveCode: {
    title: 'Código del OA',
    body: 'Identificador corto del Objetivo de Aprendizaje, tal como aparece en las Bases Curriculares.',
    example: 'OA1, OA12, OAH b.',
  },
  objectiveTitle: {
    title: 'Título',
    body: 'Resume en una frase qué debe lograr el estudiante.',
    example: 'Resolver problemas con números racionales.',
  },
  objectiveDescription: {
    title: 'Descripción',
    body: 'Detalle opcional: habilidades, contenidos o indicadores de evaluación asociados.',
    example: 'Incluye suma, resta y comparación de fracciones.',
  },
  objectiveCourse: {
    title: 'Curso',
    body: 'Nivel en el que trabajarás este objetivo. Se crean en la sección Cursos.',
    example: '1° Medio.',
  },
  objectiveSubject: {
    title: 'Asignatura',
    body: 'Materia a la que pertenece el objetivo. Se crean en la sección Asignaturas.',
    example: 'Matemática.',
  },
  objectiveUnit: {
    title: 'Unidad',
    body: 'Bloque de contenidos dentro de la asignatura. Es opcional: si no la eliges, el objetivo queda sin asignar.',
    example: 'Unidad 1 — Números.',
  },
  objectivePriority: {
    title: 'Prioridad',
    body: 'Qué tan urgente es trabajar este objetivo. Te sirve para filtrar y ordenar.',
    example: 'Baja, Media o Alta.',
  },
  objectiveStatus: {
    title: 'Estado',
    body: 'En qué etapa está el objetivo. Puedes cambiarlo después con un clic desde la lista.',
    example: 'Pendiente, En proceso o Logrado.',
  },
  objectiveNotes: {
    title: 'Observaciones',
    body: 'Notas para tu seguimiento: recursos, recordatorios o cómo evaluaste el objetivo.',
    example: 'Reforzar con guía de ejercicios en la clase 3.',
  },

  /* ------------------------------ Asignaturas ----------------------------- */
  subjectName: {
    title: 'Nombre de la asignatura',
    body: 'La materia que impartes. Debe ser único dentro de tu cuenta.',
    example: 'Matemática, Lenguaje y Comunicación.',
  },
  subjectDescription: {
    title: 'Descripción',
    body: 'Texto opcional para recordar el enfoque o el énfasis de la asignatura.',
    example: 'Pensamiento lógico, algebraico y análisis de datos.',
  },
  subjectColor: {
    title: 'Color',
    body: 'Sirve para reconocer la asignatura de un vistazo en el dashboard y en las listas.',
    example: 'Azul para Matemática, verde para Ciencias.',
  },

  /* --------------------------------- Cursos ------------------------------- */
  courseName: {
    title: 'Nombre del curso',
    body: 'El nivel con el que trabajas. Debe ser único dentro de tu cuenta.',
    example: '4° Medio, 8° Básico.',
  },
  courseDescription: {
    title: 'Descripción',
    body: 'Texto opcional para dar contexto al curso.',
    example: 'Cuarto año de enseñanza media, jornada mañana.',
  },

  /* -------------------------------- Unidades ------------------------------ */
  unitName: {
    title: 'Nombre de la unidad',
    body: 'Bloque de contenidos dentro de una asignatura y un curso.',
    example: 'Unidad 1 — Números y álgebra.',
  },
  unitSubject: {
    title: 'Asignatura',
    body: 'Materia a la que pertenece la unidad.',
    example: 'Matemática.',
  },
  unitCourse: {
    title: 'Curso',
    body: 'Nivel en el que se dicta la unidad. La misma unidad puede repetirse en otro curso.',
    example: '1° Medio.',
  },
  unitDescription: {
    title: 'Descripción',
    body: 'Texto opcional con los contenidos y habilidades de la unidad.',
    example: 'Operatoria con enteros y resolución de problemas.',
  },
};
