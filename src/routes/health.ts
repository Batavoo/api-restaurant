import { Router, Request, Response } from 'express';

const healthRoutes = Router();

healthRoutes.get('/', async (_: Request, res: Response) => {
  try {
    res.json({ status: 'OK', timeStamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
});

export { healthRoutes };
