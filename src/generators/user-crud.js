import { DRIZZLE_CLIENT, DRIZZLE_USER_SCHEMA, drizzleUserTable } from './drizzle.js';
import { layout } from './layout.js';
import { MONGOOSE_CLIENT, MONGOOSE_USER_MODEL, mongooseUserModel } from './mongoose.js';
import { PRISMA_CLIENT, PRISMA_GENERATED, PRISMA_SCHEMA, prismaUserModel } from './prisma.js';
import { SEQUELIZE_CLIENT, SEQUELIZE_USER_MODEL, sequelizeUserModel } from './sequelize.js';
import { requireClean } from './shared.js';
import { TYPEORM_CLIENT, TYPEORM_USER_SCHEMA, typeormUserSchema } from './typeorm.js';

const REAL_ORMS = ['prisma', 'drizzle', 'typeorm', 'sequelize', 'mongoose'];
export const ORMS = [...REAL_ORMS, 'memory'];
const T = 'user-crud';
const SRC = '{{srcDir}}';
const paths = layout(true);

const DOMAIN = `${SRC}/domain/api`;
const ENTITY = `${paths.entities}/user.entity.ts`;
const VALIDATION = `${DOMAIN}/dtos/user/user-validation.ts`;
const CREATE_DTO = `${DOMAIN}/dtos/user/create-user.dto.ts`;
const UPDATE_DTO = `${DOMAIN}/dtos/user/update-user.dto.ts`;
export const DATASOURCE = `${DOMAIN}/datasources/user.datasource.ts`;
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

const REPOSITORY_IMPL = `${paths.repositories}/user.repository.impl.ts`;
const CACHE_CONTRACT = `${paths.serviceContracts}/cache.service.ts`;
const CACHE_PROVIDER = `${paths.services}/cache.provider.ts`;

const HTTP = `${SRC}/presentation/http`;
const ROUTES_INDEX = `${HTTP}/routes/index.ts`;
const HTTP_ERROR = `${HTTP}/errors/http-error.ts`;
const PRESENTATION = `${HTTP}/user`;
const CONTROLLER = `${PRESENTATION}/user.controller.ts`;
export const COMPOSITION = `${PRESENTATION}/user.composition.ts`;
const USER_ROUTES = `${PRESENTATION}/user.routes.ts`;

const USE_CASE_IMPORTS = {
  createUseCaseImport: USE_CASE.create,
  getAllUseCaseImport: USE_CASE.getAll,
  getByIdUseCaseImport: USE_CASE.getById,
  updateUseCaseImport: USE_CASE.update,
  deleteUseCaseImport: USE_CASE.delete,
};

export function resolveOrm(features, requested) {
  if (requested) {
    if (!ORMS.includes(requested)) throw new Error(`ORM no soportado: "${requested}". Opciones: ${ORMS.join(', ')}`);
    if (requested !== 'memory' && !features[requested]) throw new Error(`Primero configura el ORM: jg g ${requested}`);
    return requested;
  }
  const configured = REAL_ORMS.filter((orm) => features[orm]);
  if (configured.length > 1) {
    throw new Error(`Hay varios ORMs configurados (${configured.join(', ')}): elige uno con --orm <orm>`);
  }
  return configured[0] ?? 'memory';
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

export function assertUserModel(orm, read) {
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

const DATASOURCES = {
  prisma: {
    class: 'PrismaUserDatasource',
    args: 'PrismaDatabase.getInstance()',
    client: PRISMA_CLIENT,
    clientClass: 'PrismaDatabase',
    mapperTemplate: 'user.mapper.ts.tpl',
    mapperImports: { generatedImport: PRISMA_GENERATED },
    datasourceImports: { generatedImport: PRISMA_GENERATED },
    note: 'Aplica el modelo: npm run prisma:migrate -- --name users && npm run prisma:generate',
  },
  drizzle: {
    class: 'DrizzleUserDatasource',
    args: 'DrizzleDatabase.getInstance()',
    client: DRIZZLE_CLIENT,
    clientClass: 'DrizzleDatabase',
    mapperTemplate: 'user.mapper.ts.tpl',
    mapperImports: { schemaImport: DRIZZLE_USER_SCHEMA },
    datasourceImports: { clientImport: DRIZZLE_CLIENT, schemaImport: DRIZZLE_USER_SCHEMA },
    note: 'Aplica la tabla: npm run drizzle:generate && npm run drizzle:migrate',
  },
  typeorm: {
    class: 'TypeOrmUserDatasource',
    args: '() => TypeOrmDatabase.getInstance()',
    client: TYPEORM_CLIENT,
    clientClass: 'TypeOrmDatabase',
    mapperTemplate: 'typeorm-user.mapper.ts.tpl',
    model: typeormUserSchema,
    mapperImports: { schemaImport: TYPEORM_USER_SCHEMA },
    datasourceImports: { schemaImport: TYPEORM_USER_SCHEMA },
    note: 'Aplica la tabla: npm run typeorm:generate && npm run typeorm:migrate',
  },
  sequelize: {
    class: 'SequelizeUserDatasource',
    args: 'SequelizeDatabase.getInstance()',
    client: SEQUELIZE_CLIENT,
    clientClass: 'SequelizeDatabase',
    mapperTemplate: 'sequelize-user.mapper.ts.tpl',
    model: sequelizeUserModel,
    mapperImports: { schemaImport: SEQUELIZE_USER_MODEL },
    datasourceImports: { schemaImport: SEQUELIZE_USER_MODEL },
    note: 'Crea la tabla: npm run sequelize:sync',
  },
  mongoose: {
    class: 'MongooseUserDatasource',
    args: 'MongooseDatabase.getInstance()',
    client: MONGOOSE_CLIENT,
    clientClass: 'MongooseDatabase',
    mapperTemplate: 'mongoose-user.mapper.ts.tpl',
    model: mongooseUserModel,
    mapperImports: { schemaImport: MONGOOSE_USER_MODEL },
    datasourceImports: { schemaImport: MONGOOSE_USER_MODEL },
    note: 'MongoDB: los ids son ObjectId (24 hex). Si usas caché, vacíala al cambiar de base: los ids cacheados no existen en la otra.',
  },
  memory: {
    class: 'InMemoryUserDatasource',
    args: '',
    note: 'Datasource en memoria: los usuarios se pierden al reiniciar.',
  },
};

const datasourceFile = (orm) =>
  `${paths.datasources}/${orm === 'memory' ? 'in-memory' : orm}-user.datasource.ts`;
const mapperFile = (orm) => `${paths.mappers}/${orm}-user.mapper.ts`;
const ormFlags = (orm) => ({ prisma: orm === 'prisma', drizzle: orm === 'drizzle', memory: orm === 'memory' });

/** Datasource que usa hoy el composition root (por su clase), o null. */
export function currentDatasource(read) {
  const match = read(COMPOSITION)?.match(/new (\w+UserDatasource)\(/);
  return Object.keys(DATASOURCES).find((orm) => DATASOURCES[orm].class === match?.[1]) ?? null;
}

/** Infraestructura de un datasource: implementación, mapper y modelo/tabla del ORM. Nada de dominio. */
export function datasourcePlan(orm) {
  const ds = DATASOURCES[orm];
  const files = [];
  const appends = [];

  if (orm === 'prisma') appends.push(prismaUserModel);
  if (orm === 'drizzle') {
    const table = drizzleUserTable();
    files.push(table.file);
    appends.push(table.append);
  }
  if (ds.model) files.push(ds.model);
  if (orm !== 'memory') {
    files.push({
      template: `${T}/${ds.mapperTemplate}`,
      to: mapperFile(orm),
      vars: ormFlags(orm),
      imports: { entityImport: ENTITY, ...ds.mapperImports },
    });
  }
  files.push({
    template: `${T}/${datasourceFile(orm).split('/').pop()}.tpl`,
    to: datasourceFile(orm),
    imports: {
      datasourceImport: DATASOURCE,
      entityImport: ENTITY,
      errorsImport: ERRORS,
      ...(orm === 'memory' ? {} : { mapperImport: mapperFile(orm) }),
      ...ds.datasourceImports,
    },
  });

  return { files, appends, note: ds.note };
}

/** El composition root es el único archivo que conoce el datasource concreto. */
export function compositionFile(orm, cache, overwrite = false) {
  const ds = DATASOURCES[orm];
  return {
    template: `${T}/user.composition.ts.tpl`,
    to: COMPOSITION,
    overwrite,
    vars: {
      ...ormFlags(orm),
      cache,
      hasClient: Boolean(ds.client),
      clientClass: ds.clientClass ?? '',
      datasourceClass: ds.class,
      datasourceArgs: ds.args,
    },
    imports: {
      ...USE_CASE_IMPORTS,
      datasourceImplImport: datasourceFile(orm),
      repositoryImplImport: REPOSITORY_IMPL,
      controllerImport: CONTROLLER,
      ...(ds.client ? { clientImport: ds.client } : {}),
      ...(cache ? { cacheProviderImport: CACHE_PROVIDER } : {}),
    },
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
    const datasource = datasourcePlan(orm);
    const cacheVars = cache ? { cacheContract: 'CacheService' } : {};
    const cacheImports = cache ? { cacheImport: CACHE_CONTRACT, cacheKeysImport: CACHE_KEYS } : {};
    const useCaseFile = (template, to, imports) => ({
      template: `${T}/${template}`,
      to,
      vars: { cache, ...cacheVars },
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
        ...datasource.files,
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
        compositionFile(orm, cache),
        { template: `${T}/user.routes.ts.tpl`, to: USER_ROUTES, imports: { compositionImport: COMPOSITION } },
      ],
      appends: [
        ...datasource.appends,
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
        datasource.note,
        `Para cambiar de datasource sin tocar el dominio: jg g datasource user --orm <${ORMS.join('|')}>`,
        'Endpoints en /api/users: POST /, GET /, GET /:id, PATCH /:id, DELETE /:id',
      ],
    };
  },
};

