import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const COMPOSE_FILES = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];

function loadDocument(file) {
  if (!existsSync(file)) return new YAML.Document({ services: {} });
  const doc = YAML.parseDocument(readFileSync(file, 'utf8'));
  if (doc.errors.length > 0) {
    throw new Error(`No se pudo parsear ${file}: ${doc.errors[0].message}`);
  }
  return doc.contents ? doc : new YAML.Document({ services: {} });
}

export function addComposeService(cwd, { name, service, volumes = [] }, { force } = {}, write) {
  const fileName = COMPOSE_FILES.find((f) => existsSync(join(cwd, f))) ?? COMPOSE_FILES[0];
  const file = join(cwd, fileName);
  const isNew = !existsSync(file);
  const doc = loadDocument(file);

  const exists = doc.hasIn(['services', name]);
  if (exists && !force) return { fileName, status: 'skipped' };

  const node = doc.createNode(service);
  YAML.visit(node, {
    Scalar(_, scalar) {
      // compose recomienda citar "HOST:CONTAINER" y valores tipo yes/no (YAML 1.1 los vuelve booleanos)
      if (typeof scalar.value === 'string' && /:|^(y|n|yes|no|on|off|true|false)$/i.test(scalar.value)) {
        scalar.type = 'QUOTE_DOUBLE';
      }
    },
  });
  doc.setIn(['services', name], node);
  for (const volume of volumes) {
    if (!doc.hasIn(['volumes', volume])) doc.setIn(['volumes', volume], null);
  }

  write(file, doc.toString({ nullStr: '' }));
  return { fileName, status: isNew ? 'created' : 'updated' };
}
