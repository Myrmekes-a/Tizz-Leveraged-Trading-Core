import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';

import { pairRouter } from './routers/pairs';
import { priceRouter } from './routers/prices';
import { chartsRouter } from './routers/charts';
import { tradesRouter } from './routers/trades';
import { volumeRouter } from './routers/volume';

// Create Express server
const app = express();

// Express configuration
app.set('port', process.env.PORT ?? 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../logs'), { maxAge: 31557600000 }));
app.use(cors());

// router
app.use('/charts', chartsRouter);
app.use('/pair', pairRouter);
app.use('/price', priceRouter);
app.use('/trades', tradesRouter);
app.use('/volume', volumeRouter);

app.get('/', async (_req: Request, res: Response) => {
  return res.send('Tizz backend works!');
});

export default app;
