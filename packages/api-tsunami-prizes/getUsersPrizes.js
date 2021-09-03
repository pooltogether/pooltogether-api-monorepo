// import { log } from '../../utils/sentry'
// import { contract } from '@pooltogether/etherplex'

// import { batch } from './cloudflare-workers-batch'
// import { ethers } from 'ethers'
// import { isValidAddress, NETWORK } from '@pooltogether/utilities'

// const SUPPORTED_NETWORKS = [NETWORK.mainnet, NETWORK.rinkeby, NETWORK.polygon]
// const MOCK_POOLS = Object.freeze({
//   [NETWORK.mainnet]: {
//     config: { chainId: NETWORK.mainnet },
//     prizePool: { address: '0xde9ec95d7708B8319CCca4b8BC92c0a3B70bf416' },
//     prizeStrategy: { address: '0x3D9946190907aDa8b70381b25c71eB9adf5f9B7b' },
//     tokens: {
//       ticket: {
//         decimals: 6,
//         address: '0xD81b1A8B1AD00Baa2D6609E0BAE28A38713872f7'
//       },
//       underlyingToken: {
//         decimals: 6,
//         address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
//       }
//     }
//   },
//   [NETWORK.rinkeby]: {
//     config: { chainId: NETWORK.rinkeby },
//     prizePool: { address: '0x4706856fa8bb747d50b4ef8547fe51ab5edc4ac2' },
//     prizeStrategy: { address: '0x5E0A6d336667EACE5D1b33279B50055604c3E329' },
//     tokens: {
//       ticket: {
//         decimals: 18,
//         address: '0x4fb19557fbd8d73ac884efbe291626fd5641c778'
//       },
//       underlyingToken: {
//         decimals: 18,
//         address: '0x5592ec0cfb4dbc12d3ab100b257153436a1f0fea'
//       }
//     }
//   }
// })
// const MOCK_PRIZES = {
//   0: [
//     {
//       amountUnformatted: ethers.BigNumber.from('5000000000000000000'),
//       distributionIndex: 2,
//       drawId: 0,
//       pickIndex: 4
//     }
//   ],
//   1: [
//     {
//       amountUnformatted: ethers.BigNumber.from('5000000000000000000'),
//       distributionIndex: 2,
//       drawId: 1,
//       pickIndex: 4
//     }
//   ],
//   2: [
//     {
//       amountUnformatted: ethers.BigNumber.from('5000000000000000000'),
//       distributionIndex: 2,
//       drawId: 2,
//       pickIndex: 13
//     },
//     {
//       amountUnformatted: ethers.BigNumber.from('10000000000000000000'),
//       distributionIndex: 1,
//       drawId: 2,
//       pickIndex: 1
//     }
//   ],
//   3: [
//     {
//       amountUnformatted: ethers.BigNumber.from('10000000000000000000000'),
//       distributionIndex: 0,
//       drawId: 3,
//       pickIndex: 1
//     }
//   ]
// }

// export const getUsersPrizes = async (_chainId, prizePoolAddress, usersAddress, _draws) => {
//   const chainId = Number(_chainId)
//   const draws = _draws.map(Number)

//   if (!SUPPORTED_NETWORKS.includes(chainId)) {
//     throw new Error('Invalid chain id')
//   } else if (!isValidAddress(usersAddress)) {
//     throw new Error('Invalid user address')
//   } else if (!isValidAddress(prizePoolAddress) || !MOCK_POOLS[chainId]) {
//     throw new Error('Invalid prize pool address')
//   }

//   // TODO: Create Tsunami instance

//   // TODO: Fetch latest draw # - It'd be nice to get this into some script that listens to events and updates the KV accordingly.
//   const currentDrawId = 4

//   const isBelowCurrentDrawId = (drawId) => drawId < currentDrawId
//   if (!draws.every(isBelowCurrentDrawId)) {
//     throw new Error('Invalid draw ids')
//   }

//   // Update prizes
//   await updatePrizes(chainId, prizePoolAddress, usersAddress, draws)

//   // Get requested prizes
//   const allPrizes = getUsersPrizesFromKV(chainId, prizePoolAddress, usersAddress)
//   const prizes = {}
//   draws.forEach((draw) => (prizes[draw] = allPrizes[draw]))
//   return prizes
// }

// const getUsersPrizesFromKV = (chainId, prizePoolAddress, usersAddress) => {
//   let allPrizes = TSUNAMI_PRIZES.get(getUsersPrizesKey(chainId, prizePoolAddress, usersAddress))
//   return allPrizes || {}
// }

// const getUsersPrizesKey = (chainId, prizePoolAddress, usersAddress) =>
//   `${chainId}-${prizePoolAddress}-${usersAddress}`

// const updatePrizes = async (chainId, prizePoolAddress, usersAddress, draws) => {
//   // TODO: Create Tsunami Player instance
//   const allPrizes = getUsersPrizesFromKV(chainId, prizePoolAddress, usersAddress)

//   // Fetch any missing prizes
//   const promises = []
//   draws.forEach((draw) => {
//     if (!allPrizes[draw]) {
//       // TODO: Fetch the prizes for the specific draw & push to array
//       promises.push(
//         new Promise((resolve) => {
//           resolve({
//             drawId: draw,
//             prizes: MOCK_PRIZES[draw]
//           })
//         })
//       )
//     }
//   })

//   const results = await Promise.allSettled(promises)

//   results.forEach((result) => {
//     const { status, value } = result
//     if (status === 'rejected') {
//       throw new Error('Error fetching users prizes')
//     }
//     allPrizes[value.drawId] = value.prizes
//   })

//   // Update KV if we fetched anything
//   if (results.length) {
//     TSUNAMI_PRIZES.set(getUsersPrizesKey(chainId, prizePoolAddress, usersAddress), allPrizes)
//   }
// }
