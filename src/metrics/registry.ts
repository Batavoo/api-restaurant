import promClient, {
  Counter,
  Gauge,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from 'prom-client';

export const register = new Registry();

collectDefaultMetrics({ register });

export const httpRequestDurationMicroseconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total de requisições HTTP',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpActiveRequests = new Gauge({
  name: 'http_active_requests',
  help: 'Número de requisições ativas',
  labelNames: ['method', 'route'],
});

export const httpRequestErrors = new Counter({
  name: 'http_request_errors_total',
  help: 'Total de erros nas requisições HTTP',
  labelNames: ['method', 'route', 'error_type'],
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpActiveRequests);
register.registerMetric(httpRequestErrors);

export { promClient };
