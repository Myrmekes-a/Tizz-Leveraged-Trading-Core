import { Request, Response, Router } from 'express';
import { fetchTradesData, fetchWinnerTradesData, getLatestTradingHistory, getUserTradingHistory } from '../services/trades';
import { logger } from '../utils/logger';

const tradesRouter = Router();

tradesRouter.get('/trading-history-24h', async (_req: Request, res: Response) => {
  try {
    const data = await getLatestTradingHistory();
    return res.status(200).send(data);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

tradesRouter.get('/user-trade-history/:user', async (req: Request, res: Response) => {
  const { user } = req.params;
  try {
    const data = await getUserTradingHistory(user);
    return res.status(200).send(data);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

tradesRouter.post('/', async (req: Request, res: Response) => {
  const { addresses, start, end } = req.body;
  console.log('trade', addresses, start, end);
  try {
    const data = await fetchTradesData(addresses, start ? parseInt(start) : undefined, end ? parseInt(end) : end);
    return res.status(200).send({ data });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

tradesRouter.post('/winner', async (req: Request, res: Response) => {
  const { addresses, start, end } = req.body;
  console.log('winner', addresses, start, end);
  try {
    const data = await fetchWinnerTradesData(addresses, start ? parseInt(start) : undefined, end ? parseInt(end) : undefined);
    return res.status(200).send({ data });
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

export { tradesRouter };
