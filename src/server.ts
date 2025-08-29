import express from 'express';

import { routes } from './routes';
import { errorHandling } from './middlewares/error-handling';

export const server = (req: express.Request, res: express.Response) => {
  const PORT = process.env.PORT || 3333;
  const app = express();

  app.use(express.json());
  app.use(routes);

  app.use(errorHandling);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  return app(req, res);
};
