import express from 'express';

import { routes } from '@/routes';
import { errorHandling } from '@/middlewares/error-handling';
import { captureMetrics } from '@/middlewares/capture-metrics';

const PORT = 3333;
const app = express();

app.use(express.json());
app.use(captureMetrics);
app.use(routes);

app.use(errorHandling);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Metrics avaiable in /metrics`);
  console.log(`❤️  Healthcheck in /health`);
});
