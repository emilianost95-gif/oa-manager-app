# Gestor de Objetivos de Aprendizaje

Aplicación web completa para que una profesora organice, ordene y haga seguimiento de sus
Objetivos de Aprendizaje (OA): asignaturas, cursos, unidades, objetivos con estado y prioridad,
reordenamiento con arrastrar y soltar, filtros combinables, dashboard con indicadores,
importación desde Excel/CSV y exportación a CSV, Excel y PDF.

No es una maqueta: todo funciona de punta a punta contra PostgreSQL.

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Instalación](#2-instalación)
3. [Instalación de dependencias](#3-instalación-de-dependencias)
4. [Configuración del .env](#4-configuración-del-env)
5. [Levantar PostgreSQL](#5-levantar-postgresql)
6. [Ejecutar migraciones](#6-ejecutar-migraciones)
7. [Ejecutar el seed](#7-ejecutar-el-seed)
8. [Iniciar el backend](#8-iniciar-el-backend)
9. [Iniciar el frontend](#9-iniciar-el-frontend)
10. [Cómo crear un usuario](#10-cómo-crear-un-usuario)
11. [Cómo usar la aplicación](#11-cómo-usar-la-aplicación)
12. [Build de producción](#12-build-de-producción)
13. [Arquitectura](#13-arquitectura)
14. [API REST](#14-api-rest)
15. [Formato del archivo de importación](#15-formato-del-archivo-de-importación)
16. [Solución de problemas](#16-solución-de-problemas)

---

## 1. Requisitos

| Herramienta | Versión mínima | Para qué sirve |
|---|---|---|
| Node.js | 20 LTS (probado en 22) | Ejecutar backend y frontend |
| npm | 10 | Instalar dependencias |
| Docker + Docker Compose | cualquiera reciente | Levantar PostgreSQL sin instalarlo |
| PostgreSQL | 14+ | Alternativa si no quieres usar Docker |

Verifica que tienes lo necesario:

```bash
node -v
npm -v
docker --version
```

---

## 2. Instalación

Descomprime el proyecto y entra a la carpeta:

```bash
cd oa-manager
```

Estructura general:

```
oa-manager/
├── backend/                  API REST (Node + TypeScript + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma     Modelo de datos
│   │   ├── migrations/       Migración SQL versionada
│   │   └── seed.ts           Datos de ejemplo
│   ├── prisma.config.ts      Configuración del CLI de Prisma 7
│   └── src/
│       ├── config/           Validación de variables de entorno con Zod
│       ├── controllers/      Lógica de cada recurso
│       ├── lib/              Prisma client, auth (bcrypt + JWT), errores
│       ├── middleware/       Autenticación, validación Zod, manejo de errores
│       ├── routes/           Definición de rutas REST
│       ├── schemas/          Esquemas Zod de entrada
│       ├── services/         Consultas reutilizables (filtros, import)
│       ├── app.ts            Configuración de Express (CORS, helmet, cookies)
│       └── server.ts         Arranque del servidor
├── frontend/                 SPA (React + TypeScript + Vite + Tailwind)
│   └── src/
│       ├── components/       UI reutilizable, layout, objetivos, catálogo
│       ├── context/          AuthContext (sesión)
│       ├── hooks/            TanStack Query: objetivos, catálogo, debounce
│       ├── lib/              Cliente HTTP, etiquetas, utilidades
│       ├── pages/            Una página por sección del sidebar
│       ├── routes/           Ruta protegida
│       └── types/            Tipos compartidos con la API
├── docker-compose.yml        PostgreSQL 16 + Adminer
├── .env.example              Plantilla de variables de entorno
└── package.json              Scripts de conveniencia del monorepo
```

---

## 3. Instalación de dependencias

Opción rápida (desde la raíz):

```bash
npm install
npm run install:all
```

Opción manual:

```bash
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

---

## 4. Configuración del .env

El backend necesita su propio `.env`:

```bash
cp backend/.env.example backend/.env
```

Contenido esperado:

```env
DATABASE_URL="postgresql://oa_user:oa_password@localhost:5432/oa_manager?schema=public"
JWT_SECRET="cambia-esto-por-un-secreto-largo-y-aleatorio"
JWT_EXPIRES_IN="7d"
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

Genera un secreto real para `JWT_SECRET`:

```bash
openssl rand -base64 48
```

El frontend funciona sin configuración (usa `http://localhost:4000/api` por defecto).
Si necesitas cambiar la URL de la API:

```bash
cp frontend/.env.example frontend/.env
```

```env
VITE_API_URL="http://localhost:4000/api"
```

> Los archivos `.env` están en `.gitignore`. Nunca subas secretos reales al repositorio.

---

## 5. Levantar PostgreSQL

```bash
docker compose up -d
```

Esto levanta:

- **PostgreSQL 16** en `localhost:5432` (usuario `oa_user`, contraseña `oa_password`, base `oa_manager`)
- **Adminer** en <http://localhost:8080> para inspeccionar la base desde el navegador

Comprobar que está arriba:

```bash
docker compose ps
```

Para detenerlo (sin borrar los datos):

```bash
docker compose down
```

Para detenerlo **borrando** los datos:

```bash
docker compose down -v
```

<details>
<summary>¿No quieres usar Docker?</summary>

Crea la base manualmente y ajusta `DATABASE_URL` en `backend/.env`:

```sql
CREATE USER oa_user WITH PASSWORD 'oa_password';
CREATE DATABASE oa_manager OWNER oa_user;
```
</details>

---

## 6. Ejecutar migraciones

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

`migrate deploy` aplica la migración versionada que está en `backend/prisma/migrations/`.
`generate` crea el cliente tipado de Prisma en `backend/src/generated/prisma`.

Durante el desarrollo, si cambias `schema.prisma`, usa:

```bash
npx prisma migrate dev --name descripcion_del_cambio
```

---

## 7. Ejecutar el seed

Carga datos de ejemplo (5 asignaturas, 4 cursos, 13 unidades y 34 objetivos):

```bash
cd backend
npm run seed
```

**Credenciales de prueba que crea el seed:**

| Email | Contraseña |
|---|---|
| `profesora@colegio.cl` | `Profesora2024` |

El seed es idempotente: si lo ejecutas de nuevo, borra y vuelve a crear los datos de esa cuenta
demo. No toca las cuentas que hayas creado tú.

---

## 8. Iniciar el backend

```bash
cd backend
npm run dev
```

Queda escuchando en <http://localhost:4000>. Prueba rápida:

```bash
curl http://localhost:4000/api/health
# {"status":"ok","timestamp":"..."}
```

---

## 9. Iniciar el frontend

En otra terminal:

```bash
cd frontend
npm run dev
```

Abre <http://localhost:5173>.

**Atajo:** desde la raíz puedes levantar los dos a la vez:

```bash
npm run dev
```

**Resumen de la puesta en marcha completa desde cero:**

```bash
npm install
npm run install:all
cp backend/.env.example backend/.env
docker compose up -d
npm run migrate
npm run seed
npm run dev
```

---

## 10. Cómo crear un usuario

Tienes dos caminos:

1. **Desde la interfaz:** abre <http://localhost:5173/register>, completa nombre, email y
   contraseña (mínimo 8 caracteres) y confirma. Quedas con la sesión iniciada.
2. **Desde la API:**

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"María Pérez","email":"maria@colegio.cl","password":"MiClave2024"}'
```

Cada usuaria ve **solo sus propios datos**: cursos, asignaturas, unidades y objetivos están
asociados a su cuenta y la API verifica la pertenencia en cada operación.

---

## 11. Cómo usar la aplicación

**Primeros pasos recomendados**

1. **Cursos** → crea los niveles con los que trabajas (1° Medio, 4° Medio, …).
2. **Asignaturas** → crea Matemática, Lenguaje, etc. y elige un color para cada una.
3. **Unidades** → cada unidad pertenece a una asignatura y a un curso.
4. **Objetivos** → crea los OA con código, título, descripción, prioridad, estado y observaciones.

**Reordenar arrastrando**

En *Objetivos*, toma el ícono de agarre (⠿) a la izquierda de una tarjeta y arrástrala. El nuevo
orden se guarda en PostgreSQL inmediatamente y aparece el aviso «Orden guardado». Para que el
arrastre esté activo, el criterio de orden debe ser **«Orden personalizado» ascendente** (es el
valor por defecto). En *Unidades*, selecciona una asignatura y un curso para poder reordenarlas;
en *Asignaturas* y *Cursos* el arrastre está siempre disponible.

**Cambiar el estado**

El botón circular ⟳ de cada tarjeta rota el estado: Pendiente → En proceso → Logrado → Pendiente.
También puedes elegirlo directamente en el formulario de edición.

**Filtrar y buscar**

El buscador cubre código, título, descripción y observaciones. El botón *Filtros* abre curso,
asignatura, unidad, estado, prioridad y criterio de ordenamiento. Todos se combinan entre sí
(por ejemplo: 4° Medio + Matemática + Unidad 2 + Pendientes).

**Importar**

*Importar* → arrastra o selecciona un `.csv` o `.xlsx`. Verás una vista previa con el detalle de
cada fila, incluidos los errores exactos (fila, campo y motivo). Las asignaturas, cursos y
unidades que no existan se crean automáticamente. Confirma para guardar.

**Exportar**

*Exportar* → ajusta los filtros y descarga en CSV, Excel o PDF. La exportación respeta exactamente
los filtros seleccionados; el contador te muestra cuántos objetivos se incluirán.

**Vista por asignatura**

Haz clic en una asignatura para ver su progreso general, los cursos asociados y cada unidad con su
barra de avance y sus objetivos.

---

## 12. Build de producción

**Backend**

```bash
cd backend
npm run build     # compila TypeScript a dist/
NODE_ENV=production npm start
```

**Frontend**

```bash
cd frontend
npm run build     # genera dist/ (estáticos)
npm run preview   # sirve el build para revisarlo
```

Publica el contenido de `frontend/dist` en cualquier hosting estático (Nginx, Vercel, Netlify…).
En producción recuerda:

- Poner `NODE_ENV=production` en el backend (activa cookies `secure` y `sameSite=strict`).
- Ajustar `FRONTEND_URL` con el dominio real (CORS) y `VITE_API_URL` en el build del frontend.
- Usar un `JWT_SECRET` largo y aleatorio.
- Servir todo por HTTPS.

También puedes hacer ambos builds desde la raíz con `npm run build`.

---

## 13. Arquitectura

**Backend — Express + Prisma, por capas**

```
routes → middleware (auth + validación Zod) → controllers → services → Prisma → PostgreSQL
```

- **`config/env.ts`** valida las variables de entorno con Zod al arrancar; si falta algo, el
  proceso termina con un mensaje claro en lugar de fallar más tarde.
- **`middleware/auth.ts`** lee el JWT desde la cookie `httpOnly` (o desde `Authorization: Bearer`,
  útil para probar con curl) y deja `req.user` disponible.
- **`middleware/validate.ts`** valida `body`, `params` y `query` con Zod y devuelve errores por
  campo, que el frontend pinta junto a cada input.
- **`middleware/errorHandler.ts`** traduce los errores de Prisma (P2002, P2003, P2025, P1001…) a
  mensajes en español aptos para la usuaria. El detalle técnico se registra en consola, nunca se
  envía al navegador.
- **Aislamiento por usuaria:** cada consulta filtra por `userId` y toda operación de
  modificación verifica primero la pertenencia del recurso.

**Frontend — React + TanStack Query**

- **`lib/api.ts`** es el único punto de contacto con la API: envía cookies (`credentials:
  'include'`), normaliza los errores en una clase `ApiError` con `message` legible y `fieldErrors`,
  y gestiona la descarga de archivos.
- **TanStack Query** cachea e invalida los datos; después de cada mutación se refrescan las
  consultas afectadas, así el dashboard y los contadores siempre están al día.
- **`@dnd-kit`** implementa el arrastrar y soltar. El componente `SortableList` es genérico y lo
  reutilizan objetivos, unidades, asignaturas y cursos.
- **Tailwind CSS v4** con un token de color de marca; los componentes de UI (`Button`, `Modal`,
  `Field`, `Badge`, `ProgressBar`, `Feedback`) mantienen la interfaz consistente.

**Decisiones técnicas relevantes**

- **Prisma 7 con driver adapter (`@prisma/adapter-pg`).** La URL de la base vive en
  `prisma.config.ts`, no en `schema.prisma`, como exige Prisma 7.
- **El orden es un entero por registro.** `PUT /reorder` recibe los ids en el orden deseado y
  reasigna los índices dentro de una transacción, verificando antes que todos pertenezcan a la
  usuaria.
- **`unitId` es opcional** en los objetivos: así una importación con la columna `unidad` vacía no
  falla, y al borrar una unidad sus objetivos quedan sin unidad en vez de desaparecer
  (`ON DELETE SET NULL`).
- **Borrado en cascada** desde asignatura y curso hacia unidades y objetivos; la interfaz avisa
  cuántos registros se verán afectados antes de confirmar.

---

## 14. API REST

Todas las rutas cuelgan de `/api`. Salvo `/auth/register`, `/auth/login` y `/health`, todas
requieren sesión iniciada.

**Autenticación**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | Crear cuenta e iniciar sesión |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Usuaria autenticada |
| PUT | `/api/auth/profile` | Actualizar nombre |
| PUT | `/api/auth/password` | Cambiar contraseña |

**Objetivos**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/objectives` | Listar con filtros, búsqueda, orden y paginación |
| POST | `/api/objectives` | Crear |
| GET | `/api/objectives/:id` | Detalle |
| PUT | `/api/objectives/:id` | Actualizar |
| PATCH | `/api/objectives/:id/status` | Cambiar solo el estado |
| DELETE | `/api/objectives/:id` | Eliminar |
| PUT | `/api/objectives/reorder` | Guardar un nuevo orden |

Parámetros de `GET /api/objectives`: `search`, `courseId`, `subjectId`, `unitId`,
`status` (lista separada por comas), `priority` (idem), `sort`, `direction`, `page`, `pageSize`.

**Catálogo**

| Método | Ruta |
|---|---|
| GET / POST | `/api/subjects` |
| GET | `/api/subjects/:id` (vista detallada con unidades y progreso) |
| PUT / DELETE | `/api/subjects/:id` |
| PUT | `/api/subjects/reorder` |
| GET / POST | `/api/courses` |
| PUT / DELETE | `/api/courses/:id` |
| PUT | `/api/courses/reorder` |
| GET / POST | `/api/units` |
| PUT / DELETE | `/api/units/:id` |
| PUT | `/api/units/reorder` |

**Estadísticas, importación y exportación**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/stats/dashboard` | Totales, progreso, desglose por asignatura y prioridad |
| GET | `/api/import/template` | Plantilla CSV de ejemplo |
| POST | `/api/import/preview` | Sube el archivo y devuelve la vista previa validada |
| POST | `/api/import/confirm` | Guarda las filas confirmadas |
| GET | `/api/export/csv` | Exportar CSV (respeta los mismos filtros del listado) |
| GET | `/api/export/xlsx` | Exportar Excel |
| GET | `/api/export/pdf` | Exportar PDF |

**Formato de error**

```json
{
  "error": {
    "message": "Revisa los datos ingresados.",
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "code", "message": "El código del OA es obligatorio." }]
  }
}
```

---

## 15. Formato del archivo de importación

Columnas esperadas (la primera fila es el encabezado):

| Columna | Obligatoria | Valores aceptados |
|---|---|---|
| `codigo` | Sí | Texto, máx. 30 caracteres |
| `titulo` | Sí | Texto, mín. 3 caracteres |
| `descripcion` | No | Texto |
| `curso` | Sí | Nombre del curso; se crea si no existe |
| `asignatura` | Sí | Nombre de la asignatura; se crea si no existe |
| `unidad` | No | Nombre de la unidad; se crea si no existe |
| `prioridad` | No | `baja`, `media`, `alta` (vacío = media) |
| `estado` | No | `pendiente`, `en proceso`, `logrado` (vacío = pendiente) |
| `observaciones` | No | Texto |

Se aceptan encabezados en inglés (`code`, `title`, `subject`, …) y con o sin tildes.

Ejemplo:

```csv
codigo,titulo,descripcion,curso,asignatura,unidad,prioridad,estado,observaciones
OA1,Resolver problemas con números racionales,Operatoria en contextos reales,1° Medio,Matemática,Unidad 1 — Números,alta,pendiente,Reforzar con guía
OA2,Interpretar funciones lineales,Pendiente e intercepto,1° Medio,Matemática,Unidad 2 — Álgebra,media,en proceso,
```

Puedes descargar esta plantilla desde el botón **Descargar plantilla** de la pantalla *Importar*.

Las filas con errores se muestran en rojo indicando el campo y el motivo exacto, y se omiten al
confirmar; el resto se importa normalmente.

---

## 16. Solución de problemas

**«No pudimos conectar con el servidor»**
El backend no está corriendo o está en otro puerto. Verifica `curl http://localhost:4000/api/health`
y revisa `VITE_API_URL`.

**El backend termina con `[db] No se pudo conectar a PostgreSQL`**
La base no está levantada o `DATABASE_URL` es incorrecta. Ejecuta `docker compose up -d` y
`docker compose ps`.

**Error de CORS en la consola del navegador**
`FRONTEND_URL` del backend debe incluir exactamente el origen desde el que abres la app
(por ejemplo `http://localhost:5173`). Acepta varios separados por comas.

**`prisma migrate` falla al descargar el motor**
El CLI de Prisma descarga su binario desde `binaries.prisma.sh`. Si estás detrás de un proxy,
configura `HTTPS_PROXY` o define `PRISMA_ENGINES_MIRROR`.

**El arrastre no funciona**
En *Objetivos*, el criterio de orden debe ser «Orden personalizado» ascendente. En *Unidades*,
debes tener seleccionadas una asignatura y un curso.

**Puerto ocupado**
Cambia `PORT` en `backend/.env`, o `server.port` en `frontend/vite.config.ts`.

---

## Funcionalidades implementadas

- Registro, inicio y cierre de sesión con contraseñas hasheadas (bcrypt, 12 rondas) y JWT en
  cookie `httpOnly`.
- Rutas privadas protegidas en el frontend y verificación de pertenencia en el backend.
- CRUD completo de cursos, asignaturas, unidades y objetivos de aprendizaje.
- Reordenamiento con arrastrar y soltar persistido en PostgreSQL, en las cuatro entidades.
- Cambio rápido de estado (Pendiente / En proceso / Logrado) y campo de observaciones.
- Búsqueda por código, título, descripción y observaciones.
- Filtros combinables por curso, asignatura, unidad, estado y prioridad, con ordenamiento
  configurable.
- Dashboard con totales, porcentaje de progreso, anillo de avance, desglose por asignatura y por
  prioridad, y actividad reciente.
- Vista detallada por asignatura con progreso por unidad.
- Importación desde CSV y Excel con vista previa, validación fila a fila, detección de duplicados
  y creación automática de asignaturas, cursos y unidades faltantes.
- Exportación a CSV, Excel (con hoja de resumen) y PDF respetando los filtros activos.
- Validación con Zod en el backend y en los formularios del frontend.
- Modales de confirmación antes de eliminar, estados de carga, skeletons y notificaciones toast.
- Interfaz responsive: sidebar fijo en escritorio, menú desplegable en móvil, tablas que se
  convierten en tarjetas.
- Manejo de errores que nunca expone detalles técnicos a la usuaria.
- Botón de mostrar/ocultar contraseña en todos los campos de contraseña (login, registro,
  configuración y restablecer). Sólo cambia el `type` del input: la contraseña no se guarda,
  copia ni registra en ninguna parte.
- Recuperación de contraseña por enlace: solicitud desde el login, respuesta neutra que no revela
  si el correo está registrado, y pantalla para crear la nueva contraseña con indicador de
  fortaleza y verificación de coincidencia.
- Ayuda contextual: iconos ⓘ junto a los campos importantes de cada formulario, con explicación y
  ejemplo. Se abren con clic o tap (no dependen del hover), se cierran con Escape y funcionan en
  móvil.
- Botón **Ayuda** en el encabezado con un panel que resume qué es la aplicación, sus funciones
  principales, el acceso al modo demo y la opción de repetir el tutorial.
- Tutorial inicial de 4 pasos que se muestra una sola vez por cuenta, con Anterior / Siguiente /
  Omitir tutorial y "Comenzar" en el último paso.
- **Modo demo**: carga un set de datos ficticios (3 cursos, 4 asignaturas, 9 unidades y 20
  objetivos) para explorar la aplicación sin escribir nada. Los datos viven sólo en el navegador:
  el backend y la base de datos nunca se tocan, por lo que los datos reales quedan intactos y
  vuelven al pulsar "Salir de demo". Mientras está activo se muestra la etiqueta MODO DEMO en el
  encabezado, y las secciones Importar y Exportar avisan que sólo funcionan con datos reales.

## Recuperación de contraseña

### Cómo funciona

1. `POST /api/auth/forgot-password` con `{ email }`. Responde **siempre** lo mismo, exista o no la
   cuenta y se haya podido enviar el correo o no.
2. Se genera un token aleatorio de 32 bytes. En la tabla `password_reset_tokens` se guarda
   **sólo su SHA-256**: ni con acceso a la base de datos se puede reconstruir un enlace válido.
3. El enlace apunta a `/restablecer?token=...` en el frontend. Vence a los
   `PASSWORD_RESET_TTL_MINUTES` minutos (60 por defecto) y es de un solo uso.
4. `POST /api/auth/reset-password/verify` comprueba el enlace antes de mostrar el formulario.
5. `POST /api/auth/reset-password` cambia la contraseña, marca el token como usado y borra el
   resto de tokens de esa cuenta, todo en una transacción.

Pedir un enlace nuevo invalida el anterior. Hay un límite de 3 solicitudes por correo y 10 por IP
cada 15 minutos.

### El envío del correo

`backend/src/lib/mailer.ts` es el **único** punto de envío. Usa **Resend** por HTTP, sin
dependencias: se eligió así porque Render bloquea los puertos SMTP salientes en el plan gratuito,
y una petición HTTPS normal no se topa con esa restricción.

El envío se activa sólo cuando existen `RESEND_API_KEY` y `MAIL_FROM`. Si falta alguna:

- en desarrollo imprime el enlace en la consola del backend, así el flujo se puede probar completo;
- en producción registra una advertencia **sin** el enlace (un token en los logs equivale a una
  contraseña).

Si el proveedor está configurado pero rechaza el envío, el log lo dice explícitamente y con el
motivo que devolvió Resend — normalmente, el dominio del remitente sin verificar.

### Configurar Resend

1. Crea una cuenta en [resend.com](https://resend.com) y una API key en **API Keys**.
2. En **Domains**, verifica tu dominio agregando los registros DNS que indica. Sin dominio
   verificado puedes usar el remitente de prueba `onboarding@resend.dev`, pero Resend sólo
   entregará correos a la dirección con la que creaste la cuenta.
3. Define las dos variables en el backend (en Render: Environment → Add Environment Variable):

```
RESEND_API_KEY = re_...
MAIL_FROM      = OA Manager <no-reply@tu-dominio.cl>
```

Ambas deben ir juntas: si sólo defines una, el backend avisa al arrancar y deja el envío apagado.

### Variables de entorno

| Variable | Por defecto | Para qué sirve |
| --- | --- | --- |
| `PASSWORD_RESET_TTL_MINUTES` | `60` | Minutos que dura el enlace. |
| `PUBLIC_APP_URL` | primer origen de `FRONTEND_URL` | Base del enlace que va en el correo. |
| `RESEND_API_KEY` | — | API key de Resend. Sin ella no se envía nada. |
| `MAIL_FROM` | — | Remitente verificado del correo. |

### Migraciones al desplegar

El script `start` del backend ejecuta `prisma migrate deploy` antes de levantar el servidor, así
cada despliegue aplica solo las migraciones pendientes. Si necesitas arrancar sin migrar, usa
`npm run start:only`.

## Posibles mejoras futuras

- Verificación de cuenta por email.
- Invalidar las sesiones abiertas en otros dispositivos al cambiar la contraseña (hoy los JWT son
  sin estado y siguen vigentes hasta que vencen).
- Duplicar una asignatura completa (con unidades y objetivos) para un curso nuevo.
- Adjuntar recursos (guías, enlaces) a cada objetivo.
- Historial de cambios de estado con fechas, para ver la evolución en el tiempo.
- Planificación por semanas o períodos con fechas de inicio y término.
- Etiquetas libres además de asignatura, curso y unidad.
- Selección múltiple para cambiar estado o eliminar en lote.
- Modo oscuro y preferencias de la usuaria.
- Compartir una asignatura en modo lectura con otro docente.
- Tests automatizados (Vitest + Supertest en el backend, Playwright end-to-end).
- Dockerfile para backend y frontend, y despliegue con un solo `docker compose up`.
