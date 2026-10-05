import { requireClean } from './shared.js';
import {
  COMPOSITION,
  DATASOURCE,
  ORMS,
  assertUserModel,
  compositionFile,
  currentDatasource,
  datasourcePlan,
  resolveOrm,
} from './user-crud.js';

const MODULES = ['user'];

export const datasource = {
  name: 'datasource',
  usage: 'datasource <module>',
  description: 'cambia el datasource de un módulo (crea la implementación y reconecta el composition root, sin tocar el dominio)',
  requiresName: true,
  options: [['--orm <orm>', `datasource destino: ${ORMS.join(' | ')}`]],
  plan: ({ features, options, read, kebab }) => {
    requireClean(features, 'g datasource');
    if (!MODULES.includes(kebab)) {
      throw new Error(`Módulo no soportado: "${kebab}". Disponibles: ${MODULES.join(', ')}`);
    }
    if (read(DATASOURCE) === null || read(COMPOSITION) === null) {
      throw new Error('No existe el CRUD de usuarios. Genéralo primero: jg g user-crud');
    }
    if (!options.orm) throw new Error(`Indica el destino con --orm ${ORMS.join(' | ')}`);

    const orm = resolveOrm(features, options.orm);
    assertUserModel(orm, read);
    const from = currentDatasource(read);
    const target = datasourcePlan(orm);

    return {
      files: [...target.files, compositionFile(orm, features.cacheService, true)],
      appends: target.appends,
      run: target.run,
      notes: [
        from === orm
          ? `El composition root ya usaba ${orm}: solo se regeneró`
          : `Datasource: ${from ?? 'desconocido'} → ${orm}. Dominio, casos de uso y API sin cambios.`,
        target.note,
        'Volver atrás: jg undo (o jg g datasource user --orm <anterior>)',
      ],
    };
  },
};
