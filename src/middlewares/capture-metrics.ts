import {
  httpActiveRequests,
  httpRequestDurationMicroseconds,
  httpRequestErrors,
  httpRequestsTotal,
} from '@/metrics/registry';
import { Request, Response, NextFunction } from 'express';

export function captureMetrics(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const startTime = Date.now();

  const route = req.route?.path || req.path;

  httpActiveRequests.inc({ method: req.method, route });

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const statusCode = res.statusCode;

    httpRequestDurationMicroseconds
      .labels(req.method, route, statusCode.toString())
      .observe(duration);

    httpRequestsTotal.labels(req.method, route, statusCode.toString()).inc();
    httpActiveRequests.dec({ method: req.method, route });

    if (statusCode >= 400) {
      httpRequestErrors
        .labels(
          req.method,
          route,
          statusCode >= 500 ? 'server_error' : 'client_error',
        )
        .inc();
    }
  });

  next();
}
