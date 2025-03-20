export type PublicUser = {
  id: number;
  ensName: string;
  walletAddress: string;
  telegram: string;
  twitter: string;
  github: string;
  discord: string;
  website: string;
  pfp: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
};

export const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  wallet: true,
  provider: true,
  verified: true,
};

export type TokenDetails = {
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  error?: any | undefined;
};
