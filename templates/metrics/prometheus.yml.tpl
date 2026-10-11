global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: {{project}}
    metrics_path: {{metricsPath}}
{{#if protect}}
    # prometheus.yml no lee variables de entorno: la clave se monta como archivo (ver docker-compose.yml)
    authorization:
      type: Bearer
      credentials_file: /etc/prometheus/metrics.token
{{/if}}
    static_configs:
      # la app corre en tu máquina; si cambias PORT en el .env, cámbialo también aquí
      - targets: ['host.docker.internal:{{appPort}}']
