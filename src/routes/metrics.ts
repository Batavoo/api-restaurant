import { Router, Request, Response } from 'express';
import { register } from '@/metrics/registry';

const metricsRoutes = Router();

metricsRoutes.get('/', async (_: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
});

export { metricsRoutes };
