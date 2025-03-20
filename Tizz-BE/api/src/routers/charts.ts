import { Request, Response, Router } from 'express';
import { fetchLatestPriceData, fetchPriceChartData } from '../services/prices';

const chartsRouter = Router();

chartsRouter.get('/:pairIndex/:start/:end/:range', async (req: Request, res: Response) => {
  const { pairIndex, start, end, range } = req.params;

  try {
    const data = await fetchPriceChartData(parseInt(pairIndex), parseInt(start) * 1000, parseInt(end) * 1000, parseInt(range));
    return res.status(200).send({ table: data });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

chartsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await fetchLatestPriceData();
    return res.status(200).send(data);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

export { chartsRouter };
