# Revisión de `oa-manager-app` — probar en local y publicar en Netlify

Fecha: 29 de agosto de 2026
Revisado: configuración del monorepo, backend (Express + Prisma 7 + PostgreSQL), frontend (React 18 + Vite 6 + Tailwind 4), autenticación, y todo lo que afecta al despliegue.

---

## Resumen en una línea

La app está bien construida y el build pasa limpio, pero **Netlify sola no puede alojarla**: solo sirve el frontend. El backend y la base de datos necesitan otro hosting, y hay **cuatro cosas que romperán el despliegue si no se tocan antes** (cookie `sameSite: 'strict'`, falta de fallback SPA, `prisma generate` ausente del build, y un `JWT_SECRET` real dentro de un archivo versionado).

---

## Parte 1 — Probar la app en local

El README ya documenta esto muy bien (secciones 5 a 9). El camino corto desde cero:

```bash
cd C:\Users\emili\OneDrive\Desktop\oa-manager-app

npm install
npm run install:all
copy backend\.env.example backend\.env    # si aún no existe
docker compose up -d
npm run migrate
npm run seed
npm run dev
```

Esto deja la API en `http://localhost:4000/api` y la web en `http://localhost:5173`.
Cuenta de prueba que crea el seed: `profesora@colegio.cl` / `Profesora2024`.

### Checklist de prueba manual

Recorre esto antes de pensar en publicar. Son los caminos donde suelen aparecer los problemas:

| # | Qué probar | Qué debe pasar |
|---|---|---|
| 1 | `curl http://localhost:4000/api/health` | `{"status":"ok",...}` |
| 2 | Registrar una cuenta nueva en `/register` | Entra directo al dashboard, ya con sesión |
| 3 | Cerrar sesión y volver a entrar | Login correcto; con clave mala, mensaje claro |
| 4 | Recargar la página (F5) estando en `/objetivos` | La sesión sobrevive (cookie `oa_token`) |
| 5 | Crear asignatura → curso → unidad → objetivo | La jerarquía se encadena bien |
| 6 | Arrastrar objetivos para reordenar (dnd-kit) | El orden persiste tras recargar |
| 7 | Filtros de la página de objetivos | Estado, prioridad, búsqueda, combinados |
| 8 | Importar un archivo desde `ejemplos/` | Vista previa correcta, y conteo de filas coherente |
| 9 | Importar el **mismo** archivo dos veces | Verifica si duplica o actualiza — es el punto más frágil de cualquier importador |
| 10 | Exportar a Excel y a PDF | El archivo se descarga con nombre correcto y abre bien |
| 11 | Cambiar contraseña en Configuración | Pide la actual; con la nueva se puede volver a entrar |
| 12 | Crear una **segunda** cuenta | No ve absolutamente nada de la primera (aislamiento por usuario) |
| 13 | Abrir la app en el móvil (misma red, `http://TU-IP:5173`) | El layout responde; el sidebar no tapa el contenido |

El punto 12 es el más importante de todos: el aislamiento por `userId` está bien modelado en el esquema, pero conviene confirmarlo en la práctica antes de que esto viva en internet.

---

## Parte 2 — La realidad de Netlify

Netlify sirve **archivos estáticos** (y funciones serverless cortas). Tu app tiene tres piezas:

| Pieza | ¿Va en Netlify? | Dónde va |
|---|---|---|
| `frontend/dist` (React compilado) | ✅ Sí | Netlify |
| `backend` (Express, Prisma, exceljs, pdfkit, multer) | ❌ No | Render, Railway o Fly.io |
| PostgreSQL | ❌ No | Neon o Supabase (ambos con plan gratis) |

Intentar meter el backend en Netlify Functions significaría reescribirlo entero: cada función es efímera, y `exceljs`/`pdfkit` generando archivos más `multer` recibiendo subidas encajan mal ahí. **No vale la pena.** El backend tal como está se despliega en Render con tres líneas de configuración.

La arquitectura de destino, entonces:

```
Netlify (frontend)  ──HTTPS──>  Render (API Express)  ──>  Neon (PostgreSQL)
tuapp.netlify.app               tuapp-api.onrender.com
```

---

## Parte 3 — Los cuatro bloqueadores

### 🔴 1. La cookie de sesión no viajará entre dominios

`backend/src/lib/auth.ts`:

```ts
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: env.isProduction ? 'strict' : 'lax',   // ← el problema
  secure: env.isProduction,
  ...
};
```

Con `NODE_ENV=production`, la cookie queda en `SameSite=Strict`. El navegador **solo la envía si el sitio de origen y el destino son el mismo**. Como el frontend estará en `tuapp.netlify.app` y la API en `tuapp-api.onrender.com`, son sitios distintos: la cookie se guarda pero **nunca se envía**.

Síntoma exacto que verías: el login responde 200 y parece funcionar, y de inmediato todo lo demás devuelve 401 y te devuelve a la pantalla de login. Es un bug desconcertante si no sabes de dónde viene.

Hay dos salidas:

**Opción A — cookie cross-site (la directa).** En `backend/src/lib/auth.ts`:

```ts
const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: env.isProduction ? 'none' : 'lax',
  secure: env.isProduction,
  path: '/',
  maxAge: 1000 * 60 * 60 * 24 * 7,
};
```

Y en `backend/src/app.ts`, antes de las rutas, para que Express confíe en el proxy HTTPS de Render y marque la cookie como segura:

```ts
if (env.isProduction) app.set('trust proxy', 1);
```

`SameSite=None` **exige** `Secure`, o sea HTTPS. Render y Netlify dan HTTPS por defecto, así que se cumple. El CORS ya está bien resuelto (`credentials: true` y lista de orígenes desde `FRONTEND_URL`), solo hay que poner el dominio real de Netlify en esa variable.

**Opción B — proxy desde Netlify (la más limpia).** Netlify reenvía `/api/*` a la API, y el navegador ve todo como un mismo origen: la cookie sigue siendo first-party y no necesitas `SameSite=None` ni CORS. Se configura en `netlify.toml` (ver más abajo) y el frontend se compila con `VITE_API_URL=/api`. Añade unos milisegundos de salto extra por petición, pero evita toda la clase de problemas de cookies de terceros — y ojo, que varios navegadores están endureciendo justamente eso. Si te decides por esta, pruébala primero en un deploy preview y confirma que el login persiste.

### 🔴 2. Las rutas internas darán 404 al recargar

`App.tsx` usa `BrowserRouter` con rutas como `/objetivos` y `/asignaturas/:id`. En un hosting estático, si alguien recarga estando en `/objetivos`, Netlify busca un archivo llamado `objetivos` y no lo encuentra → 404. No hay ningún `netlify.toml` ni `public/_redirects` en el proyecto.

Solución: crear `netlify.toml` en la **raíz** del repo.

```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "frontend/dist"

# Opción B: proxy hacia la API (borra este bloque si eliges la opción A)
[[redirects]]
  from   = "/api/*"
  to     = "https://TU-API.onrender.com/api/:splat"
  status = 200
  force  = true

# Fallback SPA — debe ir SIEMPRE al final
[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

El orden importa: Netlify aplica la primera regla que calce, así que el comodín `/*` va último o se tragará también las llamadas a la API.

### 🔴 3. El build del backend fallará en un servidor limpio

`backend/package.json`:

```json
"build": "tsc -p tsconfig.json"
```

Pero `.gitignore` incluye `backend/src/generated/`, y ahí es donde Prisma emite el cliente tipado. En tu máquina funciona porque ya lo generaste una vez. En Render, que clona el repo desde cero, `tsc` no encontrará `../generated/prisma/client` y el build morirá.

Arreglo, en `backend/package.json`:

```json
"build": "prisma generate && tsc -p tsconfig.json",
"postinstall": "prisma generate"
```

Además, `prisma.config.ts` lee `env('DATABASE_URL')`, así que esa variable tiene que existir **también durante el build**, no solo en tiempo de ejecución.

### 🟠 4. Hay un `JWT_SECRET` real en un archivo versionado

El `.env.example` de la raíz trae un secreto que parece generado de verdad:

```
JWT_SECRET="ZN1iexThml7Z+6wsnHKFUd0gqz8IzE0YGh72tJMK7uqMLBxg6X8HEFHBiWRDGyhz"
```

`.gitignore` cubre `.env` pero **no** `.env.example`, así que ese valor está en el historial de `github.com/emilianost95-gif/oa-manager-app`. Quien lo tenga puede firmar tokens válidos para cualquier usuario si ese mismo secreto llega a producción.

Qué hacer:

1. En `.env.example`, reemplázalo por un placeholder — como ya hace correctamente `backend/.env.example`.
2. Genera uno nuevo para producción y ponlo **solo** en las variables de entorno de Render, nunca en un archivo del repo.
3. Si el repo es público, considera además rotarlo en el historial de git.

---

## Parte 4 — Pasos del despliegue

### 4.1 Base de datos (Neon)

Crea un proyecto en [neon.tech](https://neon.tech), copia la cadena de conexión y asegúrate de que termine en `?sslmode=require`.

Aplica las migraciones desde tu máquina, apuntando a la base remota:

```bash
cd backend
set DATABASE_URL=postgresql://...neon.tech/...?sslmode=require
npx prisma migrate deploy
```

**No corras el seed en producción** — crea la cuenta demo con una contraseña que está escrita en el README.

### 4.2 API (Render)

Nuevo *Web Service* apuntando al repo:

- Root directory: `backend`
- Build command: `npm ci && npx prisma generate && npm run build`
- Start command: `npm start`

Variables de entorno:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | la cadena de Neon con `sslmode=require` |
| `JWT_SECRET` | uno nuevo, largo y aleatorio |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://tuapp.netlify.app` (el dominio real, exacto, sin barra final) |
| `PORT` | Render lo inyecta solo; el código ya lo lee |

Verifica con `https://tu-api.onrender.com/api/health` antes de seguir.

> El plan gratis de Render duerme el servicio tras ~15 minutos sin tráfico. La primera petición después tarda unos 30–50 segundos en responder. `frontend/src/lib/api.ts` ya muestra un mensaje de error legible en ese caso, pero vale la pena que lo sepas antes de mostrarle la app a alguien.

### 4.3 Frontend (Netlify)

Con el `netlify.toml` de arriba en la raíz, Netlify toma la configuración solo. La única variable a definir en el panel:

- `VITE_API_URL` = `https://tu-api.onrender.com/api` (opción A) o `/api` (opción B)

Es una variable de Vite: se congela en el bundle **durante el build**. Si la cambias después, hay que redesplegar.

### 4.4 Verificación post-despliegue

1. Abre la URL de Netlify y registra una cuenta.
2. Recarga con F5 estando en `/objetivos` → no debe dar 404 ni echarte al login.
3. Abre DevTools → Application → Cookies y confirma que `oa_token` existe.
4. Exporta un PDF, para probar el camino largo (autenticación + generación + descarga).

Si el paso 3 falla, el problema es la cookie del bloqueador nº 1.

---

## Parte 5 — Observaciones menores

**Bundle de 379 kB (113 kB gzip) en un solo chunk.** Está dentro de lo aceptable, pero React Router, TanStack Query, dnd-kit y lucide-react viajan juntos en la primera carga. Si quieres afinarlo, un `manualChunks` en `vite.config.ts` separando `react`/`react-dom`/`react-router-dom` en un chunk de vendor mejora el cacheo entre despliegues. No es bloqueante.

**Archivo basura en `backend/`.** Hay un `.envdocker compose up -d.txt` de 0 bytes, resultado de un comando mal tecleado. Bórralo.

**`@types/node ^26.2.0` en el frontend** con Node 24 instalado. No rompe nada hoy, pero es una desalineación que puede dar avisos raros de tipos.

**Sin tests automatizados.** Para un proyecto de este tamaño no es grave, pero el importador (`import.service.ts`, 8 KB de lógica de parseo y deduplicación) es exactamente la clase de código que se agradece tener cubierto — es donde un caso raro puede corromper datos de la usuaria en silencio.

**Lo que está bien resuelto**, y vale la pena decirlo: `helmet` activo, `bcrypt` con 12 rondas, cookie `httpOnly`, validación con Zod en todas las entradas, aislamiento por `userId` bien modelado con cascadas e índices, manejo de errores centralizado, y mensajes de error en español pensados para quien usa la app y no para quien la programó. La base es sólida; lo que falta es puramente configuración de despliegue.

---

## Orden sugerido

1. Probar en local con la checklist de la Parte 1.
2. Arreglar los cuatro bloqueadores de la Parte 3.
3. Volver a probar en local que nada se rompió.
4. Desplegar en el orden de la Parte 4: base → API → frontend.
