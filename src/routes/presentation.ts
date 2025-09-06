import { Router, Request, Response } from 'express';

const presentationRoutes = Router();

presentationRoutes.get('/', async (_: Request, res: Response) => {
  try {
    res.json({
      message: '✨ Novo endpoint, olá apresentação!',
      timeStamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
});

export { presentationRoutes };
