import { DRIZZLE_CLIENT, drizzleTable, drizzleTableFile } from './drizzle.js';
import { layout } from './layout.js';
import { PRISMA_CLIENT, PRISMA_GENERATED, prismaModel } from './prisma.js';
import { requireClean } from './shared.js';

const ORMS = ['prisma', 'drizzle'];

function inMemoryPlan(paths, entityFile, contract) {
  return {
    files: [
      {
        template: 'repository/in-memory.repository.ts.tpl',
        to: `${paths.repositories}/in-memory-{{kebab}}.repository.ts`,
        imports: { entityImport: entityFile, repositoryImport: contract },
      },
    ],
  };
}

function prismaPlan(paths, entityFile, contract) {
  const mapper = `${paths.mappers}/prisma-{{kebab}}.mapper.ts`;
  return {
    files: [
      {
        template: 'prisma/mapper.ts.tpl',
        to: mapper,
        imports: { entityImport: entityFile, generatedImport: PRISMA_GENERATED },
      },
      {
        template: 'prisma/repository.ts.tpl',
        to: `${paths.repositories}/prisma-{{kebab}}.repository.ts`,
        imports: {
          entityImport: entityFile,
          repositoryImport: contract,
          mapperImport: mapper,
          clientImport: PRISMA_CLIENT,
          generatedImport: PRISMA_GENERATED,
        },
      },
    ],
    appends: [prismaModel()],
    notes: ['Aplica el modelo: npm run prisma:migrate -- --name add_{{snake}} && npm run prisma:generate'],
  };
}

function drizzlePlan(paths, entityFile, contract) {
  const mapper = `${paths.mappers}/drizzle-{{kebab}}.mapper.ts`;
  const schemaFile = drizzleTableFile('{{kebab}}');
  const table = drizzleTable(schemaFile);
  return {
    files: [
      table.file,
      {
        template: 'drizzle/mapper.ts.tpl',
        to: mapper,
        imports: { entityImport: entityFile, schemaImport: schemaFile },
      },
      {
        template: 'drizzle/repository.ts.tpl',
        to: `${paths.repositories}/drizzle-{{kebab}}.repository.ts`,
        imports: {
          entityImport: entityFile,
          repositoryImport: contract,
          mapperImport: mapper,
          schemaImport: schemaFile,
          clientImport: DRIZZLE_CLIENT,
        },
      },
    ],
    appends: [table.append],
    notes: ['Aplica la tabla: npm run drizzle:generate && npm run drizzle:migrate'],
  };
}

export const repository = {
  name: 'repository',
  usage: 'repository <name>',
  description: 'contrato de repositorio + implementación in-memory o con ORM (crea la entidad si falta)',
  requiresName: true,
  options: [['--orm <orm>', `implementación con ORM: ${ORMS.join(' | ')} (requiere clean)`]],
  plan: ({ features, options }) => {
    const { orm } = options;
    if (orm) {
      if (!ORMS.includes(orm)) throw new Error(`ORM no soportado: "${orm}". Opciones: ${ORMS.join(', ')}`);
      requireClean(features, `g repository --orm ${orm}`);
      if (!features[orm]) throw new Error(`Primero configura el ORM: jg g ${orm}`);
    }

    const paths = layout(features.clean);
    const entityFile = `${paths.entities}/{{kebab}}.entity.ts`;
    const contract = `${paths.repositoryContracts}/{{kebab}}.repository.ts`;
    const ormPlan = { prisma: prismaPlan, drizzle: drizzlePlan }[orm] ?? inMemoryPlan;
    const specific = ormPlan(paths, entityFile, contract);

    return {
      ...specific,
      files: [
        { template: 'entity/entity.ts.tpl', to: entityFile },
        { template: 'repository/repository.ts.tpl', to: contract, imports: { entityImport: entityFile } },
        ...specific.files,
      ],
    };
  },
};
