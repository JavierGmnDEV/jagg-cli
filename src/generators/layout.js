const S = '{{srcDir}}';

export const CLEAN_FOLDERS = [
  'domain/api/datasources',
  'domain/api/dtos',
  'domain/api/repositories',
  'domain/api/entities',
  'domain/api/services',
  'domain/api/use-cases',
  'infrastructure/api/mappers',
  'infrastructure/api/datasources',
  'infrastructure/api/repositories',
  'infrastructure/api/services',
  'infrastructure/data',
  'presentation',
];

/** Carpetas destino según la estructura del proyecto (default o `jg g clean`). */
export function layout(clean) {
  if (clean) {
    return {
      entities: `${S}/domain/api/entities`,
      repositoryContracts: `${S}/domain/api/repositories`,
      repositories: `${S}/infrastructure/api/repositories`,
      datasources: `${S}/infrastructure/api/datasources`,
      useCases: `${S}/domain/api/use-cases`,
      serviceContracts: `${S}/domain/api/services`,
      services: `${S}/infrastructure/api/services`,
      mappers: `${S}/infrastructure/api/mappers`,
      data: `${S}/infrastructure/data`,
    };
  }
  return {
    entities: `${S}/domain/entities`,
    repositoryContracts: `${S}/domain/repositories`,
    repositories: `${S}/infrastructure/repositories`,
    useCases: `${S}/application/use-cases`,
  };
}
