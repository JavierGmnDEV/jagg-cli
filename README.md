# jagg-cli

CLI de scaffolding para proyectos **Node.js + TypeScript** con **Clean Architecture**. Con un comando genera los archivos de un servicio (contratos de dominio, adapters, singletons), instala sus dependencias, lo agrega al `docker-compose.yml` y completa el `.env.example`. Todo se puede deshacer.

```bash
npm install -g jagg-cli

jg g clean      # estructura de carpetas
jg g express    # servidor Express 5 + TypeScript listo para usar
jg g env        # validador de variables de entorno (Zod)
jg g redis      # cache Redis + servicio docker
jg g prisma     # ORM Prisma + Postgres en docker
jg g user-crud  # CRUD de usuarios completo en /api/users
jg undo         # deshace lo último
```

## Requisitos

- Node.js **20.12** o superior
- Un proyecto con `package.json` (npm, pnpm, yarn o bun; se detecta por el lockfile)

## Comandos

| Comando | Descripción |
|---|---|
| `jg g <generador> [nombre]` | Ejecuta un generador (`g` es alias de `generate`) |
| `jg list` | Lista los generadores disponibles |
| `jg undo [n]` | Deshace las últimas `n` generaciones (por defecto 1) |
| `jg history` | Muestra lo que se puede deshacer |
| `jg init` | Crea `jg.config.json` |

### Opciones de `generate`

| Opción | Efecto |
|---|---|
| `-d, --dry-run` | Muestra lo que haría sin escribir nada |
| `-f, --force` | Sobrescribe archivos y servicios existentes |
| `--skip-install` | No instala dependencias |
| `--skip-docker` | No modifica `docker-compose.yml` |
| `--src <dir>` | Carpeta base del código (por defecto `src`) |

Ejecutar dos veces el mismo generador es seguro: los archivos existentes se saltan salvo que uses `--force`.

## Generadores

| Generador | Qué genera | Dependencias | Docker |
|---|---|---|---|
| `clean` | Estructura de carpetas Clean Architecture | — | — |
| `express` | Servidor Express 5, `tsconfig`, scripts dev/build/start, manejo de errores | `express`, `cors`, `helmet`, `typescript`, `tsx`, `tsup` | `Dockerfile` |
| `env` | Validador de env estilo [env-var](https://www.npmjs.com/package/env-var) con adapter Zod | `zod` | — |
| `redis` | Contrato de cache, servicio, cliente singleton | `ioredis` | `redis:7-alpine` |
| `postgres` | Config y `Pool` singleton | `pg` | `postgres:16-alpine` |
| `prisma` | Schema, cliente singleton, scripts | `@prisma/client`, `@prisma/adapter-pg`, `prisma` | `postgres:16-alpine` |
| `drizzle` | Schema, cliente singleton, scripts | `drizzle-orm`, `pg`, `drizzle-kit` | `postgres:16-alpine` |
| `entity <Nombre>` | Entidad de dominio | — | — |
| `repository <Nombre>` | Contrato + implementación in-memory | — | — |
| `repository <Nombre> --orm prisma\|drizzle` | Contrato + mapper + repositorio con el ORM | — | — |
| `usecase <nombre>` | Caso de uso | — | — |
| `user-crud [--orm prisma\|drizzle\|memory]` | CRUD de usuarios: entidad, DTOs, contratos, casos de uso, API (+caché si hay redis) | — | — |
| `datasource user --orm prisma\|drizzle\|memory` | Cambia el datasource del CRUD sin tocar el dominio | — | — |

`express`, `prisma`, `drizzle` y `repository --orm` requieren la estructura `clean`; `user-crud` requiere `clean` y `express`.

### `jg g clean`

```
src/
├── domain/api/
│   ├── datasources/  dtos/  repositories/
│   └── entities/  services/  use-cases/
├── infrastructure/
│   ├── api/
│   │   ├── mappers/  datasources/  repositories/
│   │   └── services/        ← implementaciones de servicios (ej. Redis)
│   ├── data/                ← ORMs (Prisma, Drizzle, Postgres)
│   └── redis/               ← config + cliente singleton
└── presentation/
```

El dominio solo contiene contratos (interfaces) para invertir dependencias; la infraestructura los implementa. Una vez creada esta estructura, el resto de los generadores escribe en ella automáticamente.

### `jg g express`

Deja un proyecto nuevo listo para arrancar:

```
tsconfig.json          # estricto, module Preserve + moduleResolution Bundler
tsup.config.ts         # build a dist/main.js (ESM)
Dockerfile             # multi-stage, usuario no root
.dockerignore  .gitignore
src/
├── load-env.ts        # carga .env antes que cualquier config
├── main.ts            # arranque + cierre ordenado (SIGINT/SIGTERM)
└── presentation/http/
    ├── app.ts         # helmet, cors, JSON, rutas, 404 y errores
    ├── routes/        # index.ts + health.routes.ts (GET /api/health)
    ├── errors/        # HttpError.badRequest(), .notFound(), ...
    └── middlewares/   # not-found.ts, error-handler.ts
```

Agrega `"type": "module"` a `package.json` y los scripts:

| Script | Comando |
|---|---|
| `npm run dev` | `tsx watch src/main.ts` (recarga al guardar) |
| `npm run build` | `tsup` |
| `npm start` | `node dist/main.js` |
| `npm run typecheck` | `tsc --noEmit` |

Con `jg g env` previo, el puerto y `NODE_ENV` se leen validados desde `appConfig`. Las rutas lanzan `HttpError` y el manejador central responde con el status y un JSON `{ error, details }`.

```bash
jg g clean && jg g express
npm run dev     # http://localhost:3000/api/health
```

### `jg g env`

```ts
import { env } from './infrastructure/env/env.provider';

const port = env.get('PORT').required().asPort();          // number
const debug = env.get('DEBUG').default('false').asBool();  // boolean
const tags = env.get('TAGS').asArray();                    // string[] | undefined
const mode = env.get('NODE_ENV').required().asEnum(['development', 'production']);
```

Métodos: `asString`, `asInt`, `asFloat`, `asPort`, `asBool`, `asUrl`, `asEmail`, `asEnum`, `asArray`, `asJson<T>()`. Sin `.required()` ni `.default()` el tipo incluye `undefined`. Un valor inválido lanza `EnvValidationError` al arrancar.

Si `env` existe, `redis`, `postgres`, `prisma` y `drizzle` validan su configuración con él.

### `jg g redis`

```ts
import { getCache } from './infrastructure/api/services/cache.provider';

const cache = getCache();                       // CacheService (contrato de dominio)
await cache.set('user:1', { name: 'Ana' }, 60); // TTL en segundos
const user = await cache.get<{ name: string }>('user:1');
```

### `jg g prisma` / `jg g drizzle`

Crean la configuración en `infrastructure/data/`, un modelo/tabla `User` de ejemplo, el servicio `postgres` en docker y scripts en `package.json`:

```bash
docker compose up -d postgres

npm run prisma:migrate -- --name init && npm run prisma:generate   # Prisma
npm run drizzle:generate && npm run drizzle:migrate                 # Drizzle
```

Luego, un repositorio real:

```bash
jg g repository Product --orm prisma
```

```
domain/api/entities/product.entity.ts                         # entidad
domain/api/repositories/product.repository.ts                 # contrato
infrastructure/api/mappers/prisma-product.mapper.ts           # toDomain / toPersistence
infrastructure/api/repositories/prisma-product.repository.ts  # implementación
```

Además agrega `model Product` a `schema.prisma` (o la tabla `products` al schema de Drizzle).

### `jg g user-crud`

Genera un CRUD de usuarios (`id`, `name`, `email` único, `createdAt`, `updatedAt`) recorriendo todas las capas, y lo registra en `/api/users`. Conviene ejecutarlo al final, cuando ya están el ORM y Redis:

```bash
jg g clean && jg g express && jg g env && jg g redis && jg g prisma
jg g user-crud
```

```
domain/api/
├── entities/user.entity.ts                  # UserEntity (readonly + static create)
├── dtos/user/                               # CreateUserDto, UpdateUserDto → [error, dto]
├── datasources/user.datasource.ts           # contrato (abstract class)
├── repositories/user.repository.ts          # contrato (abstract class)
├── errors/user.errors.ts                    # UserNotFoundError, EmailAlreadyInUseError
└── use-cases/user/                          # create, get-users, get-user-by-id, update, delete
infrastructure/api/
├── datasources/prisma-user.datasource.ts    # o drizzle- / in-memory-
├── mappers/prisma-user.mapper.ts            # fila del ORM → UserEntity
└── repositories/user.repository.impl.ts     # delega en el datasource
presentation/http/user/
├── user.composition.ts                      # composition root: arma el grafo
├── user.controller.ts                       # errores de dominio → 404 / 409
└── user.routes.ts
```

- **Datasource**: el ORM configurado; con Prisma y Drizzle a la vez elige con `--orm`; sin ORM, en memoria.
- **Caché**: si existe `jg g redis`, los casos de uso aplican cache-aside (`users:all`, `users:<id>`, TTL 60 s) e invalidan en cada escritura. Sin Redis se generan sin caché.
- **Endpoints**: `POST /`, `GET /`, `GET /:id`, `PATCH /:id` (parcial), `DELETE /:id`. Validación → 400, no existe → 404, email repetido → 409.

Después de generarlo aplica el modelo (`npm run prisma:migrate -- --name users && npm run prisma:generate`, o `drizzle:generate` + `drizzle:migrate`).

### `jg g datasource user --orm <orm>`

Intercambia la base de datos del CRUD en un comando. El dominio solo conoce el contrato `UserDatasource`, así que el cambio queda en infraestructura:

```bash
jg g datasource user --orm drizzle   # prisma → drizzle
jg g datasource user --orm memory    # para tests o demos
jg g datasource user --orm prisma    # vuelta atrás instantánea
```

- Crea `infrastructure/api/datasources/<orm>-user.datasource.ts` y su mapper (y el modelo/tabla si faltan). Si ya existían, los reutiliza.
- Reescribe solo `presentation/http/user/user.composition.ts`, el composition root, que es el único archivo que nombra la clase concreta.
- Entidad, DTOs, contratos, casos de uso, caché, controller y rutas no cambian.
- Los datasources anteriores se conservan; `jg undo` restaura el composition root previo.

El ORM destino tiene que estar configurado (`jg g prisma` / `jg g drizzle`). Si editaste el composition root a mano, el cambio lo regenera (lo anterior se recupera con `jg undo`).

## Deshacer cambios

Cada generación queda registrada en `.jg/history.json` (con su propio `.gitignore`, nunca se commitea).

```bash
jg history            # 1 = la más reciente
jg undo               # deshace la última
jg undo 3             # deshace las últimas 3
jg undo --dry-run     # muestra qué revertiría
jg undo --force       # revierte aunque hayas editado los archivos
```

El undo borra los archivos creados, restaura los modificados (`docker-compose.yml`, `.env`, schemas), elimina carpetas vacías, quita los scripts agregados y desinstala los paquetes que instaló. Si editaste un archivo después de generarlo, se detiene para no perder tu trabajo.

## Configuración

`jg init` crea `jg.config.json`:

```json
{
  "srcDir": "src",
  "importExtension": "",
  "packageManager": null
}
```

| Campo | Descripción |
|---|---|
| `srcDir` | Carpeta base del código |
| `importExtension` | `""` para CommonJS/bundlers (Next.js, Vite); `".js"` para ESM con `"module": "NodeNext"` |
| `packageManager` | Fuerza `npm`, `pnpm`, `yarn` o `bun` (por defecto se detecta) |

## Agregar un generador

1. Crea las plantillas en `templates/<nombre>/*.tpl`. Variables disponibles: `{{pascal}}`, `{{camel}}`, `{{kebab}}`, `{{snake}}`, `{{pluralCamel}}`, `{{pluralSnake}}`, `{{srcDir}}`, `{{project}}`. Para variantes usa bloques `{{#if flag}}…{{else}}…{{/if}}` con un `vars: { flag: true }`.
2. Crea `src/generators/<nombre>.js` con un `plan()` que declare `files`, `dependencies`, `env`, `compose`, `scripts`, etc. Los imports entre archivos se calculan solos con `imports`.
3. Regístralo en `src/generators/index.js`.

Escribir archivos, editar el compose y el `.env`, instalar paquetes y el undo son comunes a todos los generadores. Usa `src/generators/redis.js` como referencia.

## Desarrollo

```bash
git clone https://github.com/JavierGmnDEV/jagg-cli.git
cd jagg-cli
npm install
npm link        # deja `jg` disponible globalmente apuntando a este código
```

## Licencia

MIT
