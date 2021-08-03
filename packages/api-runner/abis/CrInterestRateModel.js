export const CrInterestRateModalAbi = [
  {
    inputs: [
      { internalType: 'uint256', name: 'baseRatePerYear', type: 'uint256' },
      { internalType: 'uint256', name: 'multiplierPerYear', type: 'uint256' },
      { internalType: 'uint256', name: 'jumpMultiplierPerYear', type: 'uint256' },
      { internalType: 'uint256', name: 'kink1_', type: 'uint256' },
      { internalType: 'uint256', name: 'kink2_', type: 'uint256' },
      { internalType: 'uint256', name: 'roof_', type: 'uint256' },
      { internalType: 'address', name: 'owner_', type: 'address' }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'baseRatePerBlock', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'multiplierPerBlock', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'jumpMultiplierPerBlock', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'kink1', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'kink2', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'roof', type: 'uint256' }
    ],
    name: 'NewInterestParams',
    type: 'event'
  },
  {
    constant: true,
    inputs: [],
    name: 'baseRatePerBlock',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'blocksPerYear',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'cash', type: 'uint256' },
      { internalType: 'uint256', name: 'borrows', type: 'uint256' },
      { internalType: 'uint256', name: 'reserves', type: 'uint256' }
    ],
    name: 'getBorrowRate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'cash', type: 'uint256' },
      { internalType: 'uint256', name: 'borrows', type: 'uint256' },
      { internalType: 'uint256', name: 'reserves', type: 'uint256' },
      { internalType: 'uint256', name: 'reserveFactorMantissa', type: 'uint256' }
    ],
    name: 'getSupplyRate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'isInterestRateModel',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'jumpMultiplierPerBlock',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'kink1',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'kink2',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'multiplierPerBlock',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'roof',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { internalType: 'uint256', name: 'baseRatePerYear', type: 'uint256' },
      { internalType: 'uint256', name: 'multiplierPerYear', type: 'uint256' },
      { internalType: 'uint256', name: 'jumpMultiplierPerYear', type: 'uint256' },
      { internalType: 'uint256', name: 'kink1_', type: 'uint256' },
      { internalType: 'uint256', name: 'kink2_', type: 'uint256' },
      { internalType: 'uint256', name: 'roof_', type: 'uint256' }
    ],
    name: 'updateTripleRateModel',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { internalType: 'uint256', name: 'cash', type: 'uint256' },
      { internalType: 'uint256', name: 'borrows', type: 'uint256' },
      { internalType: 'uint256', name: 'reserves', type: 'uint256' }
    ],
    name: 'utilizationRate',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]