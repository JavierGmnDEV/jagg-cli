apiVersion: 1

datasources:
  - name: Prometheus
    # el dashboard apunta a este uid: si lo cambias, cámbialo también en monitoring/grafana/dashboards
    uid: prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
