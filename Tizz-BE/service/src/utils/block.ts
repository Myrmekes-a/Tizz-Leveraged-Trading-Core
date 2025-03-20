import { BlockTag } from 'ethcall';
import { ethers } from 'ethers';

export const getDateOfBlock = async (
  provider: ethers.providers.Provider,
  blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>,
): Promise<string> => {
  console.log("blockNumber: ", blockHashOrBlockTag);
  const ts = (await provider.getBlock(blockHashOrBlockTag)).timestamp;
  const date = new Date(ts * 1000).toISOString();
  console.log("date: ", date, ts);

  return date;
};
