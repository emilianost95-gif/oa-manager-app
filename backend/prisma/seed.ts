import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = 'profesora@colegio.cl';
const DEMO_PASSWORD = 'Profesora2024';

type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

interface SeedObjective {
  code: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  notes?: string;
}

interface SeedUnit {
  name: string;
  description: string;
  objectives: SeedObjective[];
}

interface SeedBlock {
  subject: string;
  color: string;
  subjectDescription: string;
  course: string;
  units: SeedUnit[];
}

const COURSES = [
  { name: '1° Medio', description: 'Primer año de enseñanza media' },
  { name: '2° Medio', description: 'Segundo año de enseñanza media' },
  { name: '3° Medio', description: 'Tercer año de enseñanza media' },
  { name: '4° Medio', description: 'Cuarto año de enseñanza media' },
];

const BLOCKS: SeedBlock[] = [
  {
    subject: 'Matemática',
    color: '#2563eb',
    subjectDescription: 'Pensamiento lógico, algebraico y análisis de datos.',
    course: '4° Medio',
    units: [
      {
        name: 'Unidad 1 — Números',
        description: 'Números reales, potencias y raíces en contextos reales.',
        objectives: [
          {
            code: 'OA1',
            title: 'Resolver problemas con números reales',
            description:
              'Aplicar operatoria con números racionales e irracionales en situaciones cotidianas.',
            status: 'COMPLETED',
            priority: 'HIGH',
            notes: 'Trabajado con guía de ejercicios y evaluación formativa.',
          },
          {
            code: 'OA2',
            title: 'Aplicar propiedades de potencias y raíces',
            description: 'Simplificar expresiones utilizando propiedades de potencias de base real.',
            status: 'COMPLETED',
            priority: 'MEDIUM',
          },
          {
            code: 'OA3',
            title: 'Estimar y aproximar resultados',
            description: 'Usar redondeo y notación científica para comunicar magnitudes.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
            notes: 'Falta la actividad de cierre.',
          },
        ],
      },
      {
        name: 'Unidad 2 — Álgebra y funciones',
        description: 'Modelamiento mediante funciones lineales y cuadráticas.',
        objectives: [
          {
            code: 'OA4',
            title: 'Modelar situaciones con funciones lineales',
            description: 'Identificar pendiente e intercepto y su significado en contexto.',
            status: 'PENDING',
            priority: 'HIGH',
          },
          {
            code: 'OA5',
            title: 'Analizar la función cuadrática',
            description: 'Determinar vértice, ceros y eje de simetría a partir de su expresión.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
          },
          {
            code: 'OA6',
            title: 'Resolver sistemas de ecuaciones',
            description: 'Aplicar métodos gráfico, sustitución e igualación.',
            status: 'PENDING',
            priority: 'MEDIUM',
          },
        ],
      },
      {
        name: 'Unidad 3 — Geometría',
        description: 'Geometría analítica y transformaciones en el plano.',
        objectives: [
          {
            code: 'OA7',
            title: 'Aplicar el teorema de Pitágoras',
            description: 'Resolver problemas de cálculo de distancias en el plano cartesiano.',
            status: 'COMPLETED',
            priority: 'MEDIUM',
          },
          {
            code: 'OA8',
            title: 'Describir transformaciones isométricas',
            description: 'Traslación, rotación y reflexión aplicadas a figuras planas.',
            status: 'PENDING',
            priority: 'LOW',
          },
        ],
      },
      {
        name: 'Unidad 4 — Estadística y probabilidad',
        description: 'Análisis de datos y toma de decisiones con incertidumbre.',
        objectives: [
          {
            code: 'OA9',
            title: 'Interpretar medidas de tendencia central',
            description: 'Comparar media, mediana y moda en conjuntos de datos reales.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
          },
          {
            code: 'OA10',
            title: 'Calcular probabilidades simples y compuestas',
            description: 'Usar diagramas de árbol y regla de Laplace.',
            status: 'PENDING',
            priority: 'HIGH',
            notes: 'Coordinar con la unidad de Ciencias.',
          },
          {
            code: 'OA11',
            title: 'Construir e interpretar gráficos',
            description: 'Seleccionar el gráfico adecuado según el tipo de variable.',
            status: 'COMPLETED',
            priority: 'LOW',
          },
        ],
      },
    ],
  },
  {
    subject: 'Lenguaje y Comunicación',
    color: '#7c3aed',
    subjectDescription: 'Comprensión lectora, escritura y comunicación oral.',
    course: '4° Medio',
    units: [
      {
        name: 'Unidad 1 — Lectura crítica',
        description: 'Interpretación de textos literarios y no literarios.',
        objectives: [
          {
            code: 'OA1',
            title: 'Analizar textos narrativos',
            description: 'Reconocer narrador, tiempo y espacio en obras contemporáneas.',
            status: 'COMPLETED',
            priority: 'HIGH',
          },
          {
            code: 'OA2',
            title: 'Evaluar argumentos en textos de opinión',
            description: 'Distinguir hechos de opiniones y detectar falacias frecuentes.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            notes: 'Usar columnas de prensa actuales.',
          },
          {
            code: 'OA3',
            title: 'Comparar visiones de mundo',
            description: 'Contrastar obras de distintas épocas sobre un mismo tema.',
            status: 'PENDING',
            priority: 'MEDIUM',
          },
        ],
      },
      {
        name: 'Unidad 2 — Escritura',
        description: 'Producción de textos con propósito comunicativo claro.',
        objectives: [
          {
            code: 'OA4',
            title: 'Escribir un ensayo argumentativo',
            description: 'Estructurar tesis, argumentos y contraargumentos.',
            status: 'PENDING',
            priority: 'HIGH',
          },
          {
            code: 'OA5',
            title: 'Revisar y editar textos propios',
            description: 'Aplicar criterios de coherencia, cohesión y normativa.',
            status: 'PENDING',
            priority: 'MEDIUM',
          },
          {
            code: 'OA6',
            title: 'Citar fuentes correctamente',
            description: 'Incorporar referencias y evitar el plagio.',
            status: 'IN_PROGRESS',
            priority: 'LOW',
          },
        ],
      },
      {
        name: 'Unidad 3 — Comunicación oral',
        description: 'Exposición, debate y escucha activa.',
        objectives: [
          {
            code: 'OA7',
            title: 'Participar en debates formales',
            description: 'Sostener una postura con evidencia y respeto por el turno de habla.',
            status: 'COMPLETED',
            priority: 'MEDIUM',
          },
          {
            code: 'OA8',
            title: 'Exponer con apoyo audiovisual',
            description: 'Diseñar apoyos visuales pertinentes y no redundantes.',
            status: 'PENDING',
            priority: 'LOW',
          },
        ],
      },
    ],
  },
  {
    subject: 'Historia y Ciencias Sociales',
    color: '#ea580c',
    subjectDescription: 'Comprensión del mundo social, histórico y cívico.',
    course: '3° Medio',
    units: [
      {
        name: 'Unidad 1 — Estado y ciudadanía',
        description: 'Institucionalidad democrática y participación.',
        objectives: [
          {
            code: 'OA1',
            title: 'Explicar la organización del Estado',
            description: 'Identificar los tres poderes y sus funciones.',
            status: 'COMPLETED',
            priority: 'HIGH',
          },
          {
            code: 'OA2',
            title: 'Analizar mecanismos de participación',
            description: 'Comparar formas de participación formal e informal.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
          },
          {
            code: 'OA3',
            title: 'Debatir sobre derechos humanos',
            description: 'Relacionar casos históricos con la normativa vigente.',
            status: 'PENDING',
            priority: 'HIGH',
          },
        ],
      },
      {
        name: 'Unidad 2 — Economía y sociedad',
        description: 'Recursos, trabajo y desigualdad.',
        objectives: [
          {
            code: 'OA4',
            title: 'Interpretar indicadores económicos',
            description: 'Leer IPC, PIB y desempleo en fuentes oficiales.',
            status: 'PENDING',
            priority: 'MEDIUM',
          },
          {
            code: 'OA5',
            title: 'Evaluar políticas públicas',
            description: 'Analizar impactos esperados y observados de una política.',
            status: 'PENDING',
            priority: 'LOW',
          },
        ],
      },
    ],
  },
  {
    subject: 'Biología',
    color: '#059669',
    subjectDescription: 'Sistemas vivos, salud y ambiente.',
    course: '2° Medio',
    units: [
      {
        name: 'Unidad 1 — Célula y genética',
        description: 'Estructura celular y herencia.',
        objectives: [
          {
            code: 'OA1',
            title: 'Describir la estructura celular',
            description: 'Comparar células procariontes y eucariontes.',
            status: 'COMPLETED',
            priority: 'MEDIUM',
          },
          {
            code: 'OA2',
            title: 'Explicar la división celular',
            description: 'Diferenciar mitosis y meiosis y su rol biológico.',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
          },
          {
            code: 'OA3',
            title: 'Resolver problemas de herencia',
            description: 'Aplicar leyes de Mendel en cruces simples.',
            status: 'PENDING',
            priority: 'HIGH',
            notes: 'Reforzar con ejercicios de tablero de Punnett.',
          },
        ],
      },
      {
        name: 'Unidad 2 — Ecología',
        description: 'Ecosistemas, biodiversidad y sustentabilidad.',
        objectives: [
          {
            code: 'OA4',
            title: 'Modelar flujos de materia y energía',
            description: 'Construir cadenas y redes tróficas.',
            status: 'PENDING',
            priority: 'MEDIUM',
          },
          {
            code: 'OA5',
            title: 'Evaluar impactos ambientales',
            description: 'Analizar un caso local de intervención del ecosistema.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
          },
          {
            code: 'OA6',
            title: 'Proponer acciones de sustentabilidad',
            description: 'Diseñar una campaña escolar con metas medibles.',
            status: 'PENDING',
            priority: 'LOW',
          },
        ],
      },
    ],
  },
  {
    subject: 'Inglés',
    color: '#db2777',
    subjectDescription: 'Comunicación en lengua extranjera.',
    course: '1° Medio',
    units: [
      {
        name: 'Unit 1 — Daily routines',
        description: 'Presente simple y vocabulario de rutina.',
        objectives: [
          {
            code: 'OA1',
            title: 'Describir rutinas diarias',
            description: 'Usar presente simple y adverbios de frecuencia.',
            status: 'COMPLETED',
            priority: 'MEDIUM',
          },
          {
            code: 'OA2',
            title: 'Comprender diálogos breves',
            description: 'Extraer información específica de audios cortos.',
            status: 'IN_PROGRESS',
            priority: 'MEDIUM',
          },
        ],
      },
      {
        name: 'Unit 2 — Past experiences',
        description: 'Pasado simple y relatos personales.',
        objectives: [
          {
            code: 'OA3',
            title: 'Narrar experiencias pasadas',
            description: 'Usar pasado simple regular e irregular.',
            status: 'PENDING',
            priority: 'HIGH',
          },
          {
            code: 'OA4',
            title: 'Escribir un texto breve',
            description: 'Redactar un relato de 100 palabras con conectores.',
            status: 'PENDING',
            priority: 'LOW',
          },
        ],
      },
    ],
  },
];

async function main(): Promise<void> {
  console.log('Iniciando seed...');

  // El seed es idempotente: recrea por completo los datos de la cuenta demo.
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: 'Profesora Demo',
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
    },
  });

  const courseIds = new Map<string, string>();
  for (const [index, c] of COURSES.entries()) {
    const course = await prisma.course.create({
      data: { name: c.name, description: c.description, order: index, userId: user.id },
    });
    courseIds.set(c.name, course.id);
  }

  const subjectIds = new Map<string, string>();
  let subjectOrder = 0;
  let objectiveOrder = 0;

  for (const block of BLOCKS) {
    let subjectId = subjectIds.get(block.subject);
    if (!subjectId) {
      const subject = await prisma.subject.create({
        data: {
          name: block.subject,
          description: block.subjectDescription,
          color: block.color,
          order: subjectOrder++,
          userId: user.id,
        },
      });
      subjectId = subject.id;
      subjectIds.set(block.subject, subjectId);
    }

    const courseId = courseIds.get(block.course);
    if (!courseId) throw new Error(`Curso no encontrado en el seed: ${block.course}`);

    for (const [unitIndex, u] of block.units.entries()) {
      const unit = await prisma.unit.create({
        data: {
          name: u.name,
          description: u.description,
          order: unitIndex,
          subjectId,
          courseId,
          userId: user.id,
        },
      });

      for (const o of u.objectives) {
        await prisma.learningObjective.create({
          data: {
            code: o.code,
            title: o.title,
            description: o.description,
            notes: o.notes ?? null,
            status: o.status,
            priority: o.priority,
            order: objectiveOrder++,
            userId: user.id,
            subjectId,
            courseId,
            unitId: unit.id,
          },
        });
      }
    }
  }

  const counts = {
    cursos: await prisma.course.count({ where: { userId: user.id } }),
    asignaturas: await prisma.subject.count({ where: { userId: user.id } }),
    unidades: await prisma.unit.count({ where: { userId: user.id } }),
    objetivos: await prisma.learningObjective.count({ where: { userId: user.id } }),
  };

  console.log('Seed completado:', counts);
  console.log(`\n  Usuario de prueba: ${DEMO_EMAIL}`);
  console.log(`  Contraseña:        ${DEMO_PASSWORD}\n`);
}

main()
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
