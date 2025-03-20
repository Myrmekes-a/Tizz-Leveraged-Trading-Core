import { Request, Response, Router } from 'express';
import { getTradingVariables } from '../services/pairs';
import { CollateralTypes } from '@tizz/sdk';

const pairRouter = Router();

pairRouter.get('/trading-variables/:collat', async (req: Request, res: Response) => {
  let { collat } = req.params;
  // default collateral is USDT
  if (!collat) collat = 'USDT';
  try {
    const ret = await getTradingVariables(collat as CollateralTypes);

    return res.status(200).send(ret);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

export { pairRouter };
