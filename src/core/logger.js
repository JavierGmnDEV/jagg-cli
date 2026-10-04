import { styleText } from 'node:util';

const STATUS_STYLE = {
  created: 'green',
  overwritten: 'yellow',
  updated: 'cyan',
  skipped: 'gray',
  identical: 'gray',
  deleted: 'red',
  restored: 'yellow',
  modified: 'red',
};

export const log = {
  title: (msg) => console.log(`\n${styleText('bold', msg)}`),
  info: (msg) => console.log(msg),
  warn: (msg) => console.warn(styleText('yellow', `! ${msg}`)),
  success: (msg) => console.log(styleText('green', `✔ ${msg}`)),
  status: (status, target) => {
    const label = styleText(STATUS_STYLE[status] ?? 'white', status.padEnd(11));
    console.log(`  ${label} ${target}`);
  },
};
