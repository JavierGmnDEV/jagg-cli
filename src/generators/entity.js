import { layout } from './layout.js';

export const entity = {
  name: 'entity',
  usage: 'entity <name>',
  description: 'entidad de dominio',
  requiresName: true,
  plan: ({ features }) => ({
    files: [{ template: 'entity/entity.ts.tpl', to: `${layout(features.clean).entities}/{{kebab}}.entity.ts` }],
  }),
};
