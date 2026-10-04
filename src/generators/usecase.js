import { layout } from './layout.js';

export const usecase = {
  name: 'usecase',
  usage: 'usecase <name>',
  description: 'caso de uso',
  requiresName: true,
  plan: ({ features }) => ({
    files: [
      { template: 'usecase/use-case.ts.tpl', to: `${layout(features.clean).useCases}/{{kebab}}.use-case.ts` },
    ],
  }),
};
