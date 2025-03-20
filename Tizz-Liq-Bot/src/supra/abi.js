export const ContractABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'oracle_',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'pair',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'price',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'decimals',
        type: 'uint256',
      },
    ],
    name: 'PairPrice',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'bytes',
        name: '_bytesProof',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'pair',
        type: 'uint256',
      },
    ],
    name: 'GetPairPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract ISupraOraclePull',
        name: 'oracle_',
        type: 'address',
      },
    ],
    name: 'updatePullAddress',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export const OracleProofABI = [
  {
    type: 'tuple',
    name: 'OracleProofV2',
    components: [
      {
        type: 'tuple[]',
        name: 'data',
        components: [
          {
            type: 'uint64',
            name: 'committee_id',
          },
          {
            type: 'bytes32',
            name: 'root',
          },
          {
            type: 'uint256[2]',
            name: 'sigs',
          },
          {
            type: 'tuple',
            name: 'committee_data',
            components: [
              {
                type: 'tuple[]',
                name: 'committee_feed',
                components: [
                  {
                    type: 'uint32',
                    name: 'pair',
                  },
                  {
                    type: 'uint128',
                    name: 'price',
                  },
                  {
                    type: 'uint64',
                    name: 'timestamp',
                  },
                  {
                    type: 'uint16',
                    name: 'decimals',
                  },
                  {
                    type: 'uint64',
                    name: 'round',
                  },
                ],
              },
              {
                type: 'bytes32[]',
                name: 'proof',
              },
              {
                type: 'bool[]',
                name: 'flags',
              },
            ],
          },
        ],
      },
    ],
  },
];

export const SignedCoherentClusterABI = [
  {
    type: 'tuple',
    name: 'scc',
    components: [
      {
        type: 'tuple',
        name: 'cc',
        components: [
          { type: 'bytes32', name: 'dataHash' },
          { type: 'uint256[]', name: 'pair' },
          { type: 'uint256[]', name: 'prices' },
          { type: 'uint256[]', name: 'timestamp' },
          { type: 'uint256[]', name: 'decimals' },
        ],
      },
      { type: 'bytes', name: 'qc' },
      { type: 'uint256', name: 'round' },
      {
        type: 'tuple',
        name: 'origin',
        components: [
          { type: 'bytes32', name: '_publicKeyIdentity' },
          { type: 'uint256', name: '_pubMemberIndex' },
          { type: 'uint256', name: '_committeeIndex' },
        ],
      },
    ],
  },
];
