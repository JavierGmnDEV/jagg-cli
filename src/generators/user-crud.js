import { DRIZZLE_CLIENT, DRIZZLE_USER_SCHEMA, drizzleUserTable } from './drizzle.js';
import { layout } from './layout.js';
import { PRISMA_CLIENT, PRISMA_GENERATED, PRISMA_SCHEMA, prismaUserModel } from './prisma.js';
import { requireClean } from './shared.js';

const ORMS = ['prisma', 'drizzle', 'memory'];
const T = 'user-crud';
const SRC = '{{srcDir}}';
const paths = layout(true);

const DOMAIN = `${SRC}/domain/api`;
const ENTITY = `${paths.entities}/user.entity.ts`;
const VALIDATION = `${DOMAIN}/dtos/user/user-validation.ts`;
const CREATE_DTO = `${DOMAIN}/dtos/user/create-user.dto.ts`;
const UPDATE_DTO = `${DOMAIN}/dtos/user/update-user.dto.ts`;
const DATASOURCE = `${DOMAIN}/datasources/user.datasource.ts`;
const REPOSITORY = `${paths.repositoryContracts}/user.repository.ts`;
const ERRORS = `${DOMAIN}/errors/user.errors.ts`;
const USE_CASES = `${paths.useCases}/user`;
const CACHE_KEYS = `${USE_CASES}/user-cache.ts`;
const USE_CASE = {
  create: `${USE_CASES}/create-user.use-case.ts`,
  getAll: `${USE_CASES}/get-users.use-case.ts`,
  getById: `${USE_CASES}/get-user-by-id.use-case.ts`,
  update: `${USE_CASES}/update-user.use-case.ts`,
  delete: `${USE_CASES}/delete-user.use-case.ts`,
};

const MAPPER = `${paths.mappers}/user.mapper.ts`;
const REPOSITORY_IMPL = `${paths.repositories}/user.repository.impl.ts`;
const CACHE_CONTRACT = `${paths.serviceContracts}/cache.service.ts`;
const CACHE_PROVIDER = `${paths.services}/cache.provider.ts`;

const HTTP = `${SRC}/presentation/http`;
const ROUTES_INDEX = `${HTTP}/routes/index.ts`;
const HTTP_ERROR = `${HTTP}/errors/http-error.ts`;
const PRESENTATION = `${HTTP}/user`;
const CONTROLLER = `${PRESENTATION}/user.controller.ts`;
const COMPOSITION = `${PRESENTATION}/user.composition.ts`;
const USER_ROUTES = `${PRESENTATION}/user.routes.ts`;

const USE_CASE_IMPORTS = {
  createUseCaseImport: USE_CASE.create,
  getAllUseCaseImport: USE_CASE.getAll,
  getByIdUseCaseImport: USE_CASE.getById,
  updateUseCaseImport: USE_CASE.update,
  deleteUseCaseImport: USE_CASE.delete,
};

function resolveOrm(features, requested) {
  if (requested) {
    if (!ORMS.includes(requested)) throw new Error(`ORM no soportado: "${requested}". Opciones: ${ORMS.join(', ')}`);
    if (requested !== 'memory' && !features[requested]) throw new Error(`Primero configura el ORM: jg g ${requested}`);
    return requested;
  }
  if (features.prisma && features.drizzle) {
    throw new Error('Hay Prisma y Drizzle configurados: elige uno con --orm prisma | --orm drizzle');
  }
  if (features.prisma) return 'prisma';
  if (features.drizzle) return 'drizzle';
  return 'memory';
}

/** Archivos previos con el mismo nombre pero otra forma (p. ej. `jg g entity User`) romperían el CRUD. */
function assertCompatible(read, force) {
  const checks = [
    [ENTITY, 'class UserEntity', 'jg g entity User'],
    [REPOSITORY, 'abstract class UserRepository', 'jg g repository User'],
  ];
  for (const [path, expected, origin] of checks) {
    const content = read(path);
    if (content !== null && !content.includes(expected) && !force) {
      throw new Error(
        `${path.replace(`${SRC}/`, '')} ya existe y no es compatible con el CRUD (¿viene de \`${origin}\`?).\n` +
          'Bórralo (o deshaz esa generación con jg undo) o usa --force para sobrescribirlo.',
      );
    }
  }
}

function assertUserModel(orm, read) {
  if (orm === 'prisma') {
    const model = read(PRISMA_SCHEMA)?.match(/model User \{[^}]*\}/)?.[0];
    if (model && !/\bemail\b/.test(model)) {
      throw new Error(
        'El modelo User de schema.prisma no tiene name/email (versión anterior de jg).\n' +
          'Añade `name String` y `email String @unique` + `updatedAt DateTime @updatedAt @map("updated_at")`, o bórralo para que se regenere.',
      );
    }
  }
  if (orm === 'drizzle') {
    const table = read(DRIZZLE_USER_SCHEMA);
    if (table !== null && !/\bemail\b/.test(table)) {
      throw new Error(
        'schema/user.schema.ts no tiene name/email (versión anterior de jg).\n' +
          'Bórralo para que se regenere con la tabla users completa.',
      );
    }
  }
}

function ormPlan(orm) {
  if (orm === 'prisma') {
    return {
      datasource: { file: `${paths.datasources}/prisma-user.datasource.ts`, class: 'PrismaUserDatasource' },
      args: 'PrismaDatabase.getInstance()',
      client: PRISMA_CLIENT,
      mapperImports: { generatedImport: PRISMA_GENERATED },
      datasourceImports: { generatedImport: PRISMA_GENERATED },
      appends: [prismaUserModel],
      files: [],
      note: 'Aplica el modelo: npm run prisma:migrate -- --name users && npm run prisma:generate',
    };
  }
  if (orm === 'drizzle') {
    const table = drizzleUserTable();
    return {
      datasource: { file: `${paths.datasources}/drizzle-user.datasource.ts`, class: 'DrizzleUserDatasource' },
      args: 'DrizzleDatabase.getInstance()',
      client: DRIZZLE_CLIENT,
      mapperImports: { schemaImport: DRIZZLE_USER_SCHEMA },
      datasourceImports: { clientImport: DRIZZLE_CLIENT, schemaImport: DRIZZLE_USER_SCHEMA },
      appends: [table.append],
      files: [table.file],
      note: 'Aplica la tabla: npm run drizzle:generate && npm run drizzle:migrate',
    };
  }
  return {
    datasource: { file: `${paths.datasources}/in-memory-user.datasource.ts`, class: 'InMemoryUserDatasource' },
    args: '',
    appends: [],
    files: [],
    note: 'Sin ORM: los usuarios se guardan en memoria. Con `jg g prisma` o `jg g drizzle` y después\n`jg g user-crud --force` pasa a usar la base de datos.',
  };
}

export const userCrud = {
  name: 'user-crud',
  usage: 'user-crud',
  description: 'CRUD de usuarios completo: entidad, DTOs, contratos, casos de uso (+caché si hay redis), API (requiere clean + express)',
  requiresName: false,
  options: [['--orm <orm>', `datasource a usar: ${ORMS.join(' | ')} (por defecto, el ORM configurado)`]],
  plan: ({ features, options, read }) => {
    requireClean(features, 'g user-crud');
    if (!features.express) throw new Error('`jg g user-crud` necesita el servidor HTTP. Ejecuta primero: jg g express');

    const orm = resolveOrm(features, options.orm);
    assertCompatible(read, options.force);
    assertUserModel(orm, read);

    const cache = features.cacheService;
    const specific = ormPlan(orm);
    const flags = { cache, prisma: orm === 'prisma', drizzle: orm === 'drizzle', memory: orm === 'memory' };
    const cacheVars = cache ? { cacheContract: 'CacheService' } : {};
    const cacheImports = cache ? { cacheImport: CACHE_CONTRACT, cacheKeysImport: CACHE_KEYS } : {};
    const useCaseFile = (template, to, imports) => ({
      template: `${T}/${template}`,
      to,
      vars: { ...flags, ...cacheVars },
      imports: { entityImport: ENTITY, repositoryImport: REPOSITORY, ...cacheImports, ...imports },
    });

    return {
      files: [
        // dominio
        { template: `${T}/user.entity.ts.tpl`, to: ENTITY },
        { template: `${T}/user-validation.ts.tpl`, to: VALIDATION },
        { template: `${T}/create-user.dto.ts.tpl`, to: CREATE_DTO, imports: { validationImport: VALIDATION } },
        { template: `${T}/update-user.dto.ts.tpl`, to: UPDATE_DTO, imports: { validationImport: VALIDATION } },
        { template: `${T}/user.datasource.ts.tpl`, to: DATASOURCE, imports: { entityImport: ENTITY } },
        {
          template: `${T}/user.repository.ts.tpl`,
          to: REPOSITORY,
          imports: { entityImport: ENTITY, datasourceImport: DATASOURCE },
        },
        { template: `${T}/user.errors.ts.tpl`, to: ERRORS },
        ...(cache ? [{ template: `${T}/user-cache.ts.tpl`, to: CACHE_KEYS }] : []),
        useCaseFile('create-user.use-case.ts.tpl', USE_CASE.create, {
          createDtoImport: CREATE_DTO,
          errorsImport: ERRORS,
        }),
        useCaseFile('get-users.use-case.ts.tpl', USE_CASE.getAll, {}),
        useCaseFile('get-user-by-id.use-case.ts.tpl', USE_CASE.getById, { errorsImport: ERRORS }),
        useCaseFile('update-user.use-case.ts.tpl', USE_CASE.update, {
          updateDtoImport: UPDATE_DTO,
          errorsImport: ERRORS,
        }),
        useCaseFile('delete-user.use-case.ts.tpl', USE_CASE.delete, { errorsImport: ERRORS }),

        // infraestructura
        ...specific.files,
        ...(orm === 'memory'
          ? []
          : [
              {
                template: `${T}/user.mapper.ts.tpl`,
                to: MAPPER,
                vars: flags,
                imports: { entityImport: ENTITY, ...specific.mapperImports },
              },
            ]),
        {
          template: `${T}/${specific.datasource.file.split('/').pop()}.tpl`,
          to: specific.datasource.file,
          imports: {
            datasourceImport: DATASOURCE,
            entityImport: ENTITY,
            errorsImport: ERRORS,
            ...(orm === 'memory' ? {} : { mapperImport: MAPPER }),
            ...specific.datasourceImports,
          },
        },
        {
          template: `${T}/user.repository.impl.ts.tpl`,
          to: REPOSITORY_IMPL,
          imports: { datasourceImport: DATASOURCE, entityImport: ENTITY, repositoryImport: REPOSITORY },
        },

        // presentación
        {
          template: `${T}/user.controller.ts.tpl`,
          to: CONTROLLER,
          imports: {
            createDtoImport: CREATE_DTO,
            updateDtoImport: UPDATE_DTO,
            errorsImport: ERRORS,
            httpErrorImport: HTTP_ERROR,
            ...USE_CASE_IMPORTS,
          },
        },
        {
          template: `${T}/user.composition.ts.tpl`,
          to: COMPOSITION,
          vars: { ...flags, datasourceClass: specific.datasource.class, datasourceArgs: specific.args },
          imports: {
            ...USE_CASE_IMPORTS,
            datasourceImplImport: specific.datasource.file,
            repositoryImplImport: REPOSITORY_IMPL,
            controllerImport: CONTROLLER,
            ...(specific.client ? { clientImport: specific.client } : {}),
            ...(cache ? { cacheProviderImport: CACHE_PROVIDER } : {}),
          },
        },
        { template: `${T}/user.routes.ts.tpl`, to: USER_ROUTES, imports: { compositionImport: COMPOSITION } },
      ],
      appends: [
        ...specific.appends,
        {
          to: ROUTES_INDEX,
          template: `${T}/routes.import.ts.tpl`,
          marker: "from '{{userRoutesImport}}'",
          position: 'imports',
          imports: { userRoutesImport: USER_ROUTES },
        },
        { to: ROUTES_INDEX, template: `${T}/routes.use.ts.tpl`, marker: "routes.use('/users'" },
      ],
      notes: [
        `Datasource: ${orm}${cache ? ' · caché Redis activada (TTL 60s)' : ' · sin caché (genera redis antes para activarla)'}`,
        specific.note,
        'Endpoints en /api/users: POST /, GET /, GET /:id, PATCH /:id, DELETE /:id',
      ],
    };
  },
};
