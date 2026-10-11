import { randomBytes } from 'node:crypto';
import { layout } from './layout.js';
import { dashboardJson } from './metrics-dashboard.js';
import { ENV_PROVIDER, MEASURED_USE_CASE, METRICS_CONTRACT, METRICS_PROVIDER } from './shared.js';
import { COMPOSITION, compositionFile, currentDatasource } from './user-crud.js';

const T = 'metrics';
const SRC = '{{srcDir}}';
const HTTP = `${SRC}/presentation/http`;
const APP = `${HTTP}/app.ts`;
const IMPL = `${layout(true).services}/prometheus-metrics.service.ts`;
const CONFIG = `${SRC}/infrastructure/metrics/metrics.config.ts`;
const MIDDLEWARE = `${HTTP}/middlewares/http-metrics.ts`;
const HANDLER = `${HTTP}/metrics/metrics.handler.ts`;
const ROUTES = `${HTTP}/metrics/metrics.routes.ts`;
const LOAD_SHEDDING = `${HTTP}/middlewares/load-shedding.ts`;
const LOAD_SHEDDING_CONFIG = `${SRC}/infrastructure/metrics/load-shedding.config.ts`;
const HEALTH_PATH = '/api/health';
const PROMETHEUS = 'monitoring/prometheus';
const GRAFANA = 'monitoring/grafana';
const TOKEN_FILE = `${PROMETHEUS}/metrics.token`;
const TOKEN_SCRIPT = `${PROMETHEUS}/metrics-token.mjs`;

const envValue = (content, key) => content?.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() || undefined;

function metricsPathOption(path = '/metrics') {
  if (!/^\/[\w\-/.]*$/.test(path)) throw new Error(`Ruta de métricas inválida: "${path}" (ej. /metrics)`);
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function compose(protect) {
  return [
    {
      name: 'prometheus',
      service: {
        image: 'prom/prometheus:latest',
        restart: 'unless-stopped',
        ports: ['${PROMETHEUS_PORT:-9090}:9090'],
        volumes: [
          `./${PROMETHEUS}/prometheus.yml:/etc/prometheus/prometheus.yml:ro`,
          ...(protect ? [`./${TOKEN_FILE}:/etc/prometheus/metrics.token:ro`] : []),
          'prometheus_data:/prometheus',
        ],
        // la app corre en el host: en Linux host.docker.internal no existe sin esto
        extra_hosts: ['host.docker.internal:host-gateway'],
      },
      volumes: ['prometheus_data'],
    },
    {
      name: 'grafana',
      service: {
        image: 'grafana/grafana:latest',
        restart: 'unless-stopped',
        ports: ['${GRAFANA_PORT:-3001}:3000'],
        environment: {
          GF_SECURITY_ADMIN_USER: '${GRAFANA_ADMIN_USER:-admin}',
          GF_SECURITY_ADMIN_PASSWORD: '${GRAFANA_ADMIN_PASSWORD:-admin}',
        },
        volumes: [
          `./${GRAFANA}/provisioning:/etc/grafana/provisioning:ro`,
          `./${GRAFANA}/dashboards:/etc/grafana/dashboards:ro`,
          'grafana_data:/var/lib/grafana',
        ],
        depends_on: ['prometheus'],
      },
      volumes: ['grafana_data'],
    },
  ];
}

/** Con el CRUD de usuarios, sus casos de uso pasan a medirse (el composition root se regenera). */
function userCrudComposition(features, read) {
  if (read(COMPOSITION) === null) return { files: [], note: null };
  const orm = currentDatasource(read);
  if (!orm) {
    return {
      files: [],
      note: 'No reconocí el datasource de user.composition.ts: envuelve sus casos de uso a mano con measured(...).',
    };
  }
  return {
    files: [compositionFile(orm, { cache: features.cacheService, metrics: true }, true)],
    note: 'CRUD de usuarios: sus casos de uso ya se miden (user.composition.ts regenerado).',
  };
}

export const metrics = {
  name: 'metrics',
  usage: 'metrics',
  description:
    'monitoreo con Prometheus + Grafana: métricas HTTP, de casos de uso y del proceso, dashboard listo y 503 inmediato si la app se satura; --protect exige token (requiere express)',
  requiresName: false,
  options: [
    ['--path <path>', 'ruta de métricas (por defecto: /metrics)'],
    [
      '--protect',
      'protege la ruta con un token Bearer: se genera solo en .env y monitoring/prometheus/metrics.token (no se commitea; al clonar o para rotarlo: npm run metrics:token)',
    ],
    [
      '--no-load-shedding',
      'no rechaza con 503 cuando la app se satura (por defecto sí: umbrales LOAD_SHEDDING_* en .env)',
    ],
  ],
  plan: ({ features, options, read, project }) => {
    if (!features.express) {
      throw new Error('`jg g metrics` necesita el servidor Express de jg. Ejecuta primero: jg g express');
    }

    const metricsPath = metricsPathOption(options.path);
    const protect = Boolean(options.protect);
    const appPort = envValue(read('.env'), 'PORT') ?? '3000';
    // Reutiliza la clave si ya existe: .env y el archivo que lee Prometheus deben coincidir
    const token = protect
      ? (read(TOKEN_FILE)?.trim() || envValue(read('.env'), 'METRICS_TOKEN') || randomBytes(32).toString('hex'))
      : undefined;
    const loadShedding = options.loadShedding !== false;
    const vars = { metricsPath, protect, appPort };
    const contract = { contractImport: METRICS_CONTRACT };
    const crud = userCrudComposition(features, read);

    return {
      files: [
        // dominio
        { template: `${T}/metrics.service.ts.tpl`, to: METRICS_CONTRACT },
        { template: `${T}/measured.ts.tpl`, to: MEASURED_USE_CASE, imports: contract },

        // infraestructura
        { template: `${T}/prometheus-metrics.service.ts.tpl`, to: IMPL, imports: contract },
        { template: `${T}/metrics.provider.ts.tpl`, to: METRICS_PROVIDER, imports: { ...contract, implImport: IMPL } },
        features.env
          ? { template: `${T}/metrics.config.env.ts.tpl`, to: CONFIG, vars, imports: { envImport: ENV_PROVIDER } }
          : { template: `${T}/metrics.config.ts.tpl`, to: CONFIG, vars },
        ...(loadShedding
          ? [
              features.env
                ? {
                    template: `${T}/load-shedding.config.env.ts.tpl`,
                    to: LOAD_SHEDDING_CONFIG,
                    imports: { envImport: ENV_PROVIDER },
                  }
                : { template: `${T}/load-shedding.config.ts.tpl`, to: LOAD_SHEDDING_CONFIG },
            ]
          : []),

        // presentación
        { template: `${T}/http-metrics.ts.tpl`, to: MIDDLEWARE, imports: contract },
        { template: `${T}/metrics.handler.ts.tpl`, to: HANDLER, imports: contract },
        ...(loadShedding ? [{ template: `${T}/load-shedding.ts.tpl`, to: LOAD_SHEDDING }] : []),
        {
          template: `${T}/metrics.routes.ts.tpl`,
          to: ROUTES,
          vars: { loadShedding, healthPath: HEALTH_PATH },
          imports: {
            configImport: CONFIG,
            providerImport: METRICS_PROVIDER,
            middlewareImport: MIDDLEWARE,
            handlerImport: HANDLER,
            ...(loadShedding
              ? { loadSheddingImport: LOAD_SHEDDING, loadSheddingConfigImport: LOAD_SHEDDING_CONFIG }
              : {}),
          },
        },
        ...crud.files,

        // monitoreo
        { template: `${T}/prometheus.yml.tpl`, to: `${PROMETHEUS}/prometheus.yml`, vars },
        ...(protect
          ? [
              { content: token, to: TOKEN_FILE },
              { template: `${T}/metrics-token.mjs.tpl`, to: TOKEN_SCRIPT, vars: { tokenFile: TOKEN_FILE } },
            ]
          : []),
        { template: `${T}/grafana-datasource.yml.tpl`, to: `${GRAFANA}/provisioning/datasources/prometheus.yml` },
        { template: `${T}/grafana-dashboards.yml.tpl`, to: `${GRAFANA}/provisioning/dashboards/dashboards.yml` },
        { content: dashboardJson(project, { loadShedding }), to: `${GRAFANA}/dashboards/api.json` },
      ],
      appends: [
        {
          to: APP,
          template: `${T}/app.import.ts.tpl`,
          marker: "from '{{metricsRoutesImport}}'",
          position: 'imports',
          imports: { metricsRoutesImport: ROUTES },
        },
        // Antes de helmet: así también se miden las peticiones que rechacen los demás middlewares
        {
          to: APP,
          template: `${T}/app.use.ts.tpl`,
          marker: 'app.use(metricsRoutes)',
          before: 'app.use(helmet());',
          where: 'como primer middleware de la app (antes de helmet, cors y las rutas)',
        },
        ...(protect ? [{ to: '.gitignore', template: `${T}/gitignore.tpl`, marker: TOKEN_FILE }] : []),
      ],
      env: {
        METRICS_PATH: metricsPath,
        ...(protect ? { METRICS_TOKEN: { value: token, example: '' } } : {}),
        PROMETHEUS_PORT: '9090',
        GRAFANA_PORT: '3001',
        GRAFANA_ADMIN_USER: 'admin',
        GRAFANA_ADMIN_PASSWORD: 'admin',
        ...(loadShedding
          ? {
              LOAD_SHEDDING_MAX_EVENT_LOOP_DELAY_MS: '50',
              LOAD_SHEDDING_MAX_IN_FLIGHT: '0',
              LOAD_SHEDDING_RETRY_AFTER_SECONDS: '1',
            }
          : {}),
      },
      compose: compose(protect),
      dependencies: ['@prometheus-io/client'],
      ...(protect ? { scripts: { 'metrics:token': `node ${TOKEN_SCRIPT}` } } : {}),
      notes: [
        ...(crud.note ? [crud.note] : []),
        'Siguientes pasos:\n' +
          '  npm run dev\n' +
          '  docker compose up -d prometheus grafana\n\n' +
          `  Métricas:   http://localhost:${appPort}${metricsPath}` +
          (protect ? '  (curl -H "Authorization: Bearer $METRICS_TOKEN" ...)\n' : '\n') +
          '  Prometheus: http://localhost:9090/targets  (el target debe estar UP)\n' +
          `  Grafana:    http://localhost:3001  (admin / admin) → Dashboards → ${project} · API`,
        ...(protect
          ? ['La clave no se commitea: al clonar el repo (o para rotarla) ejecuta npm run metrics:token']
          : []),
        ...(loadShedding
          ? [
              'Load shedding: con la CPU saturada (retraso medio del event loop > 50 ms) responde 503 + Retry-After\n' +
                'al instante a una parte de las peticiones (hasta el 90%). LOAD_SHEDDING_MAX_IN_FLIGHT (0 = sin límite)\n' +
                'limita además las peticiones en curso: ajústalo a tu app. /metrics y /api/health nunca se rechazan.',
            ]
          : []),
        "Para medir otro caso de uso, en su composition root: measured(new MiCasoDeUso(...), getMetrics(), 'mi_caso')",
      ],
    };
  },
};
