// En JS y no como plantilla: las leyendas de Grafana usan {{label}}, la misma sintaxis que el renderer
const DATASOURCE = { type: 'prometheus', uid: 'prometheus' };

function panel(title, unit, gridPos, targets) {
  return {
    title,
    type: 'timeseries',
    datasource: DATASOURCE,
    gridPos,
    fieldConfig: { defaults: { unit }, overrides: [] },
    options: { legend: { displayMode: 'list', placement: 'bottom' }, tooltip: { mode: 'multi' } },
    targets: targets.map(([expr, legendFormat], i) => ({
      refId: String.fromCharCode(65 + i),
      datasource: DATASOURCE,
      expr,
      legendFormat,
    })),
  };
}

/** Dashboard de la API: tráfico, latencia y errores HTTP, casos de uso y proceso Node. */
export function dashboardJson(job) {
  const j = `job="${job}"`;
  const at = (x, y, w = 12) => ({ x, y, w, h: 8 });
  const panels = [
    panel('Peticiones por segundo', 'reqps', at(0, 0), [
      [`sum by (route) (rate(http_requests_total{${j}}[1m]))`, '{{route}}'],
    ]),
    panel('Latencia p95', 's', at(12, 0), [
      [`histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket{${j}}[5m])))`, '{{route}}'],
    ]),
    panel('Respuestas con error por segundo', 'reqps', at(0, 8), [
      [`sum by (status_code) (rate(http_requests_total{${j}, status_code=~"4..|5.."}[1m]))`, '{{status_code}}'],
    ]),
    panel('Tasa de errores 5xx', 'percentunit', at(12, 8), [
      [
        `sum(rate(http_requests_total{${j}, status_code=~"5.."}[5m])) / sum(rate(http_requests_total{${j}}[5m]))`,
        '5xx',
      ],
    ]),
    panel('Casos de uso: duración p95', 's', at(0, 16), [
      [`histogram_quantile(0.95, sum by (le, use_case) (rate(use_case_duration_seconds_bucket{${j}}[5m])))`, '{{use_case}}'],
    ]),
    panel('Casos de uso: fallos por segundo (incluye errores de dominio)', 'ops', at(12, 16), [
      [`sum by (use_case) (rate(use_case_duration_seconds_count{${j}, outcome="error"}[1m]))`, '{{use_case}}'],
    ]),
    panel('Memoria', 'bytes', at(0, 24, 8), [
      [`process_resident_memory_bytes{${j}}`, 'RSS'],
      [`nodejs_heap_size_used_bytes{${j}}`, 'heap usado'],
    ]),
    panel('CPU', 'percentunit', at(8, 24, 8), [[`rate(process_cpu_seconds_total{${j}}[1m])`, 'CPU']]),
    panel('Event loop lag p99', 's', at(16, 24, 8), [[`nodejs_eventloop_lag_p99_seconds{${j}}`, 'p99']]),
  ].map((p, i) => ({ id: i + 1, ...p }));

  const dashboard = {
    uid: `${job}-api`.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40),
    title: `${job} · API`,
    tags: ['jagg-cli'],
    timezone: 'browser',
    schemaVersion: 39,
    refresh: '10s',
    time: { from: 'now-30m', to: 'now' },
    panels,
  };
  return `${JSON.stringify(dashboard, null, 2)}\n`;
}
