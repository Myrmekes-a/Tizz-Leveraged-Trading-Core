import { Request, Response, Router } from 'express';
import { fetchCurrentPairPrices, fetchPastPairPrices } from '../services/prices';

const priceRouter = Router();

priceRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const ret = await fetchCurrentPairPrices();

    return res.status(200).send(ret);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

priceRouter.get('/prices-24h-ago', async (_req: Request, res: Response) => {
  try {
    const ret = await fetchPastPairPrices();

    return res.status(200).send(ret);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

export { priceRouter };
