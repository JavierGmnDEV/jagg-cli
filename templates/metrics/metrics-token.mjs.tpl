// npm run metrics:token — genera la clave de /metrics y la escribe donde la leen la app (.env) y Prometheus.
// Útil al clonar el repo (ninguno de los dos archivos se commitea) o para rotar la clave.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const TOKEN_FILE = '{{tokenFile}}';
const token = randomBytes(32).toString('hex');

const env = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const line = /^METRICS_TOKEN=.*$/m;
const next = line.test(env)
  ? env.replace(line, `METRICS_TOKEN=${token}`)
  : `${env}${env === '' || env.endsWith('\n') ? '' : '\n'}METRICS_TOKEN=${token}\n`;

writeFileSync('.env', next);
writeFileSync(TOKEN_FILE, token);

console.log(`Nueva clave en .env y ${TOKEN_FILE}.`);
console.log('Reinicia la app (npm run dev) y Prometheus (docker compose restart prometheus).');
