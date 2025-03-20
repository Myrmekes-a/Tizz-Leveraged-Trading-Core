import { Request, Response, Router } from 'express';

import { get24hPairVolumes, getCumulativeVolumes } from '../services/volume';

const volumeRouter = Router();

volumeRouter.get('/:collat', async (req: Request, res: Response) => {
  const { collat } = req.params;

  try {
    const data = await getCumulativeVolumes(collat);
    return res.status(200).send(data);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

volumeRouter.get('/pairs/:collat', async (req: Request, res: Response) => {
  const { collat } = req.params;

  try {
    const data = await get24hPairVolumes(collat);
    return res.status(200).send(data);
  } catch (e) {
    console.error(e);
    return res.status(500).send({});
  }
});

export { volumeRouter };
