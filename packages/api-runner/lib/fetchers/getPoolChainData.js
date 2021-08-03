import remove from 'lodash.remove'
import { ethers } from 'ethers'
import { formatUnits } from '@ethersproject/units'
import { contract } from '@pooltogether/etherplex'
import { contractAddresses, SECONDS_PER_BLOCK } from '@pooltogether/current-pool-data'
import compareVersions from 'compare-versions'

import PrizePoolAbi from '@pooltogether/pooltogether-contracts/abis/PrizePool'
import PrizeStrategyAbi from '@pooltogether/pooltogether-contracts/abis/PeriodicPrizeStrategy'
import TokenFaucetABI from '@pooltogether/pooltogether-contracts/abis/TokenFaucet'
import MultipleWinnersAbi from '@pooltogether/pooltogether-contracts/abis/MultipleWinners'
import RegistryAbi from '@pooltogether/pooltogether-contracts/abis/Registry'
import ReserveAbi from '@pooltogether/pooltogether-contracts/abis/Reserve'
import CTokenAbi from '@pooltogether/pooltogether-contracts/abis/CTokenInterface'
import LootBoxControllerAbi from '@pooltogether/loot-box/abis/LootBoxController'

import { PrizePoolAbi_3_3_11 } from 'abis/PrizePoolAbi_3_3_11'
import { SablierAbi } from 'abis/SablierAbi'
import { ERC20Abi } from 'abis/ERC20Abi'
import { CustomERC721Abi as ERC721Abi } from 'abis/CustomERC721'
import { batch } from 'lib/cloudflare-workers-batch'
import {
  ERC20_BLOCK_LIST,
  CUSTOM_CONTRACT_ADDRESSES,
  DEFAULT_TOKEN_PRECISION,
  SECONDS_PER_DAY,
  NETWORK,
  COMP_DECIMALS,
  POOL_DECIMALS,
  CREAM_DECIMALS
} from 'lib/constants'
import { CompoundComptrollerAbi } from 'abis/CompoundComptroller'
import { CompoundComptrollerImplementationAbi } from 'abis/CompoundComptrollerImplementation'
import { YIELD_SOURCES } from 'lib/fetchers/getCustomYieldSourceData'
import { CrTokenAbi } from 'abis/CrTokenAbi'

const getCompoundComptrollerName = (prizePoolAddress) => `compound-comptroller-${prizePoolAddress}`
const getOldPrizePoolName = (prizePoolAddress) => `prizePool-3_3_11-${prizePoolAddress}`
const getCreamComptrollerName = (prizePoolAddress) => `cream-comptroller-${prizePoolAddress}`
const getExternalErc20AwardBatchName = (prizePoolAddress, tokenAddress) =>
  `erc20Award-${prizePoolAddress}-${tokenAddress}`
const getTokenFaucetDripTokenName = (prizePoolAddress, tokenFaucetAddress, tokenAddress) =>
  `tokenFaucetDripToken-${prizePoolAddress}-${tokenFaucetAddress}-${tokenAddress}`
const getSablierErc20BatchName = (prizePoolAddress, streamId) =>
  `sablier-${prizePoolAddress}-${streamId}`
const getErc721BatchName = (prizeAddress, tokenId) => `erc721Award-${prizeAddress}-${tokenId}`
const getCTokenBatchName = (prizeAddress, tokenAddress) => `cToken-${prizeAddress}-${tokenAddress}`
const getCrTokenBatchName = (prizeAddress, tokenAddress) =>
  `crToken-${prizeAddress}-${tokenAddress}`
const getLootBoxBatchName = (lootBoxAddress, lootBoxId) => `lootBox-${lootBoxAddress}-${lootBoxId}`
const getRegistryBatchName = (registryAddress, prizePoolAddress) =>
  `registry-${registryAddress}-${prizePoolAddress}`
const getReserveBatchName = (reserveAddress, prizePoolAddress) =>
  `reserve-${reserveAddress}-${prizePoolAddress}`

// TODO: fetchExternalErc1155Awards

const getPool = (graphPool) => {
  const poolAddressKey = Object.keys(graphPool)[0]
  return graphPool[poolAddressKey]
}

/**
 *
 * @param {*} chainId
 * @param {*} poolGraphData
 * @param {*} poolGraphData
 * @returns
 */
export const getPoolChainData = async (chainId, poolGraphData) => {
  let pool
  let batchCalls = []
  const erc721AwardsToFetchMetadataFor = []

  // First set of calls
  poolGraphData.forEach((graphPool) => {
    pool = getPool(graphPool)

    // Prize Pool
    const prizePoolContract = contract(pool.prizePool.address, PrizePoolAbi, pool.prizePool.address)
    batchCalls.push(prizePoolContract.captureAwardBalance())

    // If less than 3.4.3 request the maxTimelockDuration
    if (
      pool.contract?.subgraphVersion &&
      compareVersions(pool.contract.subgraphVersion, '3.4.3') < 0
    ) {
      const oldPrizePoolContract = contract(
        getOldPrizePoolName(pool.prizePool.address),
        PrizePoolAbi_3_3_11,
        pool.prizePool.address
      )
      batchCalls.push(oldPrizePoolContract.maxTimelockDuration())
    }

    // Prize Strategy
    const prizeStrategyContract = contract(
      pool.prizeStrategy.address,
      PrizeStrategyAbi,
      pool.prizeStrategy.address
    )
    batchCalls.push(
      prizeStrategyContract
        .isRngRequested() // used to determine if the pool is locked
        .isRngCompleted()
        .canStartAward()
        .canCompleteAward()
        .prizePeriodStartedAt()
        .prizePeriodRemainingSeconds()
        .prizePeriodSeconds()
        .estimateRemainingBlocksToPrize(
          SECONDS_PER_BLOCK[chainId] || SECONDS_PER_BLOCK[NETWORK.mainnet]
        )
    )

    // Token Faucets
    pool.tokenFaucetAddresses.forEach((tokenFaucetAddress) => {
      const tokenFaucetContract = contract(tokenFaucetAddress, TokenFaucetABI, tokenFaucetAddress)
      batchCalls.push(
        tokenFaucetContract
          .dripRatePerSecond()
          .asset()
          .measure()
          .totalUnclaimed()
      )
    })

    // External ERC20 awards
    if (pool.prize.externalErc20Awards.length > 0) {
      pool.prize.externalErc20Awards.forEach((erc20) => {
        const erc20Contract = contract(
          getExternalErc20AwardBatchName(pool.prizePool.address, erc20.address),
          ERC20Abi,
          erc20.address
        )
        batchCalls.push(erc20Contract.balanceOf(pool.prizePool.address))
      })
    }

    // External ERC721 awards
    if (pool.prize.externalErc721Awards.length > 0) {
      pool.prize.externalErc721Awards.forEach((erc721) => {
        erc721.tokenIds.forEach((tokenId) => {
          const erc721Contract = contract(
            getErc721BatchName(erc721.address, tokenId),
            ERC721Abi,
            erc721.address
          )
          batchCalls.push(
            erc721Contract
              .balanceOf(pool.prizePool.address)
              .name()
              .symbol()
              .ownerOf(tokenId)
          )
          erc721AwardsToFetchMetadataFor.push({ address: erc721.address, tokenId })
        })
      })
    }

    // Sablier
    if (pool.prize.sablierStream?.id) {
      // TODO: Add sablier to contract addresses package
      const sablierContract = contract(
        pool.prize.sablierStream.id,
        SablierAbi,
        CUSTOM_CONTRACT_ADDRESSES[chainId].Sablier
      )
      batchCalls.push(sablierContract.getStream(ethers.BigNumber.from(pool.prize.sablierStream.id)))
    }

    // cToken - Compound
    if (pool.tokens.cToken) {
      const cTokenContract = contract(
        getCTokenBatchName(pool.prizePool.address, pool.tokens.cToken.address),
        CTokenAbi,
        pool.tokens.cToken.address
      )
      batchCalls.push(cTokenContract.supplyRatePerBlock())

      // Compound Comptroller
      if (chainId === NETWORK.mainnet) {
        const comptrollerContract = contract(
          getCompoundComptrollerName(pool.prizePool.address),
          CompoundComptrollerImplementationAbi,
          CUSTOM_CONTRACT_ADDRESSES[chainId].CompoundComptroller
        )
        batchCalls.push(comptrollerContract.compAccrued(pool.prizePool.address))
      }
    }

    // crToken - Cream
    if (pool.tokens.crToken) {
      const crTokenContract = contract(
        getCrTokenBatchName(pool.prizePool.address, pool.tokens.crToken.address),
        CrTokenAbi,
        pool.tokens.crToken.address
      )
      batchCalls.push(crTokenContract.supplyRatePerBlock())

      // Cream Comptroller
      const comptrollerContract = contract(
        getCreamComptrollerName(pool.prizePool.address),
        CompoundComptrollerImplementationAbi,
        CUSTOM_CONTRACT_ADDRESSES[chainId].CreamComptroller
      )
      batchCalls.push(comptrollerContract.compAccrued(pool.prizePool.address))
    }

    // LootBox
    const lootBoxAddress = contractAddresses[chainId]?.lootBox?.toLowerCase()
    if (lootBoxAddress && pool.prize.externalErc721Awards.length > 0) {
      const lootBox = pool.prize.externalErc721Awards.find(
        (erc721) => erc721.address === lootBoxAddress
      )

      if (lootBox) {
        const lootBoxControllerAddress = contractAddresses[chainId].lootBoxController
        lootBox.tokenIds.forEach((tokenId) => {
          const lootBoxControllerContract = contract(
            getLootBoxBatchName(lootBoxAddress, tokenId),
            LootBoxControllerAbi,
            lootBoxControllerAddress
          )
          batchCalls.push(lootBoxControllerContract.computeAddress(lootBoxAddress, tokenId))
        })
      }
    }

    // Reserve Registry
    const registryAddress = pool.reserve.registry.address
    if (registryAddress !== ethers.constants.AddressZero) {
      const registryContract = contract(
        getRegistryBatchName(registryAddress, pool.prizePool.address),
        RegistryAbi,
        registryAddress
      )
      batchCalls.push(registryContract.lookup())
    }
  })

  // First big batch call
  let firstBatchValues
  try {
    firstBatchValues = await batch(chainId, ...batchCalls)
  } catch (e) {
    console.log(e.message)
  }

  batchCalls = []

  // Second set of calls
  poolGraphData.forEach((graphPool) => {
    pool = getPool(graphPool)

    // Prize Pool
    const prizePoolContract = contract(pool.prizePool.address, PrizePoolAbi, pool.prizePool.address)
    // Must be called in a separate multi-call from `captureAwardBalance`
    batchCalls.push(prizePoolContract.reserveTotalSupply())

    // Token faucet drip asset
    pool.tokenFaucetAddresses?.forEach((tokenFaucetAddress) => {
      const tokenFaucetDripAssetAddress = firstBatchValues[tokenFaucetAddress]?.asset[0]
      if (tokenFaucetDripAssetAddress) {
        const dripErc20Contract = contract(
          getTokenFaucetDripTokenName(
            pool.prizePool.address,
            tokenFaucetAddress,
            tokenFaucetDripAssetAddress
          ),
          ERC20Abi,
          tokenFaucetDripAssetAddress
        )
        batchCalls.push(
          dripErc20Contract
            .balanceOf(tokenFaucetAddress)
            .decimals()
            .symbol()
            .name()
        )
      }
    })

    // Sablier
    const sablierErc20StreamTokenAddress =
      firstBatchValues?.[pool.prize.sablierStream?.id]?.getStream.tokenAddress
    if (sablierErc20StreamTokenAddress) {
      // TODO: Add sablier to contract addresses package
      const sablierErc20Stream = contract(
        getSablierErc20BatchName(pool.prizePool.address, pool.prize.sablierStream?.id),
        ERC20Abi,
        sablierErc20StreamTokenAddress
      )
      batchCalls.push(
        sablierErc20Stream
          .decimals()
          .name()
          .symbol()
      )
    }

    // Reserve
    const registryAddress = pool.reserve.registry.address
    if (registryAddress !== ethers.constants.AddressZero) {
      const reserveAddress =
        firstBatchValues?.[getRegistryBatchName(registryAddress, pool.prizePool.address)].lookup[0]
      const reserveContract = contract(
        getReserveBatchName(reserveAddress, pool.prizePool.address),
        ReserveAbi,
        reserveAddress
      )
      batchCalls.push(reserveContract.reserveRateMantissa(pool.prizePool.address))
    }
  })

  const secondBatchValues = await batch(chainId, ...batchCalls)

  // Get External Erc721 Metadata (unfortunately many batch calls)
  const additionalBatchedCalls = await Promise.all([
    ...erc721AwardsToFetchMetadataFor.map(async (erc721Award) => {
      return {
        id: getErc721BatchName(erc721Award.address, erc721Award.tokenId),
        uri: await getErc721TokenUri(chainId, erc721Award.address, erc721Award.tokenId)
      }
    }),
    // TODO: Split award is only supported on some versions of prizeStrategies
    ...poolGraphData.map(async (graphPool) => {
      pool = getPool(graphPool)

      const prizeStrategyContract = contract(
        pool.prizeStrategy.address,
        MultipleWinnersAbi,
        pool.prizeStrategy.address
      )
      try {
        return {
          id: pool.prizeStrategy.address,
          data: await batch(chainId, prizeStrategyContract.splitExternalErc20Awards())
        }
      } catch (e) {
        return null
      }
    })
  ])

  return formatPoolChainData(
    chainId,
    poolGraphData,
    firstBatchValues,
    secondBatchValues,
    additionalBatchedCalls
  )
}

const getErc721TokenUri = async (chainId, erc721Address, tokenId) => {
  const erc721Contract = contract(
    getErc721BatchName(erc721Address, tokenId),
    ERC721Abi,
    erc721Address
  )
  let tokenURI = await _tryMetadataMethod(
    chainId,
    erc721Address,
    erc721Contract,
    tokenId,
    'tokenURI'
  )

  if (!tokenURI) {
    tokenURI = await _tryMetadataMethod(
      chainId,
      erc721Address,
      erc721Contract,
      tokenId,
      'tokenMetadata'
    )
  }
  return tokenURI
}

const _tryMetadataMethod = async (
  chainId,
  contractAddress,
  etherplexTokenContract,
  tokenId,
  method
) => {
  let tokenValues

  try {
    tokenValues = await batch(chainId, etherplexTokenContract[method](tokenId))

    return tokenValues[contractAddress][method][0]
  } catch (e) {
    console.warn(
      `NFT with tokenId ${tokenId} likely does not support metadata using method: ${method}():`,
      e.message
    )
  }
}

const formatPoolChainData = (
  chainId,
  poolGraphData,
  firstBatchValues,
  secondBatchValues,
  additionalBatchCalls
) => {
  // Format individual pool data
  const formattedPools = {}
  let pool
  poolGraphData.forEach((graphPool) => {
    pool = getPool(graphPool)

    const prizePoolAddress = pool.prizePool.address
    const prizeStrategyAddress = pool.prizeStrategy.address
    const prizeStrategyData = firstBatchValues[prizeStrategyAddress]

    // If less than 3.4.3 set the maxTimelockDuration
    let maxTimelockDurationSeconds = null
    if (
      pool.contract?.subgraphVersion &&
      compareVersions(pool.contract.subgraphVersion, '3.4.3') < 0
    ) {
      maxTimelockDurationSeconds = firstBatchValues[
        getOldPrizePoolName(pool.prizePool.address)
      ].maxTimelockDuration[0].toString()
    }

    const formattedPoolChainData = {
      config: {
        chainId,
        splitExternalErc20Awards: additionalBatchCalls.find(
          (response) => response.id === prizeStrategyAddress
        )?.data?.[prizeStrategyAddress].splitExternalErc20Awards[0],
        maxTimelockDurationSeconds
      },
      prizePool: {},
      prize: {
        amount: formatUnits(
          firstBatchValues[prizePoolAddress].captureAwardBalance[0],
          pool.tokens.underlyingToken.decimals
        ),
        amountUnformatted: firstBatchValues[prizePoolAddress].captureAwardBalance[0],
        isRngRequested: prizeStrategyData.isRngRequested[0],
        isRngCompleted: prizeStrategyData.isRngCompleted[0],
        canStartAward: prizeStrategyData.canStartAward[0],
        canCompleteAward: prizeStrategyData.canCompleteAward[0],
        prizePeriodStartedAt: prizeStrategyData.prizePeriodStartedAt[0],
        prizePeriodRemainingSeconds: prizeStrategyData.prizePeriodRemainingSeconds[0],
        prizePeriodSeconds: prizeStrategyData.prizePeriodSeconds[0],
        estimatedRemainingBlocksToPrize: formatUnits(
          prizeStrategyData.estimateRemainingBlocksToPrize[0],
          18
        ),
        estimatedRemainingBlocksToPrizeUnformatted:
          prizeStrategyData.estimateRemainingBlocksToPrize[0]
      },
      reserve: {
        amountUnformatted: secondBatchValues[prizePoolAddress].reserveTotalSupply[0],
        amount: formatUnits(
          secondBatchValues[prizePoolAddress].reserveTotalSupply[0],
          pool.tokens.underlyingToken.decimals
        )
      },
      contract: pool.contract
    }

    // Token listener
    let tokenFaucetDripTokens = []
    pool.tokenFaucetAddresses?.forEach((tokenFaucetAddress) => {
      const tokenFaucetData = firstBatchValues[tokenFaucetAddress]
      const dripTokenAddress = tokenFaucetData.asset[0]
      const dripTokenResponse =
        secondBatchValues[
          getTokenFaucetDripTokenName(pool.prizePool.address, tokenFaucetAddress, dripTokenAddress)
        ]

      const dripToken = {
        tokenFaucetAddress,
        address: dripTokenAddress.toLowerCase(),
        amount: formatUnits(dripTokenResponse.balanceOf[0], dripTokenResponse.decimals[0]),
        amountUnformatted: dripTokenResponse.balanceOf[0],
        decimals: dripTokenResponse.decimals[0],
        name: dripTokenResponse.name[0],
        symbol: dripTokenResponse.symbol[0]
      }

      const dripRatePerSecondUnformatted = tokenFaucetData.dripRatePerSecond[0]
      const dripRatePerDayUnformatted = tokenFaucetData.dripRatePerSecond[0].mul(SECONDS_PER_DAY)

      const totalUnclaimedUnformatted = tokenFaucetData.totalUnclaimed[0]
      const totalUnclaimed = formatUnits(totalUnclaimedUnformatted, dripToken.decimals)

      const faucetsDripTokenBalanceUnformatted = dripTokenResponse.balanceOf[0]
      const faucetsDripTokenBalance = formatUnits(
        faucetsDripTokenBalanceUnformatted,
        dripToken.decimals
      )

      const remainingDripTokenBalanceUnformatted = faucetsDripTokenBalanceUnformatted.sub(
        totalUnclaimedUnformatted
      )
      const remainingDripTokenBalance = formatUnits(
        remainingDripTokenBalanceUnformatted,
        dripToken.decimals
      )

      let remainingDaysUnformatted = remainingDripTokenBalanceUnformatted
        .mul(100)
        .div(dripRatePerDayUnformatted)
      const remainingDays = Number(remainingDaysUnformatted.toString()) / 100
      remainingDaysUnformatted = remainingDaysUnformatted.div(100)

      const tokenFaucet = {
        address: tokenFaucetAddress.toLowerCase(),
        dripRatePerSecond: formatUnits(dripRatePerSecondUnformatted, dripToken.decimals),
        dripRatePerSecondUnformatted,
        dripRatePerDay: formatUnits(dripRatePerDayUnformatted, dripToken.decimals),
        dripRatePerDayUnformatted,
        faucetsDripTokenBalance,
        faucetsDripTokenBalanceUnformatted,
        totalUnclaimed,
        totalUnclaimedUnformatted,
        remainingDays,
        remainingDaysUnformatted,
        remainingDripTokenBalance,
        remainingDripTokenBalanceUnformatted,
        measure: tokenFaucetData.measure[0],
        asset: dripTokenAddress.toLowerCase()
      }

      if (!formattedPoolChainData.tokenFaucets) {
        formattedPoolChainData.tokenFaucets = []
      }
      formattedPoolChainData.tokenFaucets.push(tokenFaucet)

      tokenFaucet.dripToken = dripToken

      // Add to tokens list
      tokenFaucetDripTokens.push(dripToken)

      formattedPoolChainData.tokens = {
        ...formattedPoolChainData.tokens,
        tokenFaucetDripTokens
      }
    })

    // External ERC20 awards
    // NOTE: editing pool graph data here to merge the token amounts in
    // This is undesirable as it goes against the pattern for merging poolChainData & poolGraphData
    // but it is the simplist way to merge the arrays.
    if (pool.prize.externalErc20Awards.length > 0) {
      pool.prize.externalErc20Awards = pool.prize.externalErc20Awards
        .filter((erc20) => !ERC20_BLOCK_LIST[chainId]?.includes(erc20.address.toLowerCase()))
        .map((erc20) => {
          const erc20AwardData =
            firstBatchValues[getExternalErc20AwardBatchName(prizePoolAddress, erc20.address)]

          erc20.amount = formatUnits(erc20AwardData.balanceOf[0], erc20.decimals)
          erc20.amountUnformatted = erc20AwardData.balanceOf[0]
          return erc20
        })
    }

    // External ERC721 awards
    // NOTE: editing pool graph data here to merge the token amounts in
    // This is undesirable as it goes against the pattern for merging poolChainData & poolGraphData
    // but it is the simplist way to merge the arrays.
    if (pool.prize.externalErc721Awards.length > 0) {
      pool.prize.externalErc721Awards = pool.prize.externalErc721Awards
        .map((erc721) =>
          erc721.tokenIds.map((tokenId) => {
            const erc721Uri = additionalBatchCalls.find(
              (response) => response.id === getErc721BatchName(erc721.address, tokenId)
            )?.uri
            const erc721AwardData = firstBatchValues[getErc721BatchName(erc721.address, tokenId)]

            const erc721Award = {
              ...erc721,
              amount: erc721AwardData.balanceOf[0],
              id: tokenId,
              uri: erc721Uri
            }
            delete erc721Award.tokenIds
            return erc721Award
          })
        )
        .flat()
    }

    // Sablier
    if (pool.prize.sablierStream?.id) {
      const sablierStreamData = firstBatchValues[pool.prize.sablierStream.id]
      const sablierStreamTokenData =
        secondBatchValues[getSablierErc20BatchName(prizePoolAddress, pool.prize.sablierStream.id)]
      const sablierStreamToken = {
        address: sablierStreamData.getStream.tokenAddress.toLowerCase(),
        name: sablierStreamTokenData.name[0],
        decimals: sablierStreamTokenData.decimals[0],
        symbol: sablierStreamTokenData.symbol[0]
      }

      formattedPoolChainData.prize.sablierStream = {
        deposit: sablierStreamData.getStream.deposit,
        ratePerSecond: sablierStreamData.getStream.ratePerSecond,
        remainingBalance: sablierStreamData.getStream.remainingBalance,
        startTime: sablierStreamData.getStream.startTime,
        stopTime: sablierStreamData.getStream.stopTime
      }

      formattedPoolChainData.tokens = {
        ...formattedPoolChainData.tokens,
        sablierStreamToken
      }
    }

    // cToken
    if (pool.tokens.cToken) {
      const cTokenData =
        firstBatchValues[getCTokenBatchName(pool.prizePool.address, pool.tokens.cToken.address)]
      formattedPoolChainData.tokens = {
        ...formattedPoolChainData.tokens,
        cToken: {
          ...formattedPoolChainData?.tokens?.cToken,
          supplyRatePerBlock: cTokenData.supplyRatePerBlock[0]
        }
      }

      if (chainId === NETWORK.mainnet) {
        const compoundComptrollerKey = getCompoundComptrollerName(pool.prizePool.address)
        formattedPoolChainData.prize.yield = {
          [YIELD_SOURCES.comp]: {
            unclaimedAmountUnformatted: firstBatchValues[compoundComptrollerKey].compAccrued[0],
            unclaimedAmount: formatUnits(
              firstBatchValues[compoundComptrollerKey].compAccrued[0],
              COMP_DECIMALS
            )
          }
        }

        formattedPoolChainData.tokens.comp = {
          address: CUSTOM_CONTRACT_ADDRESSES[NETWORK.mainnet].COMP,
          decimals: COMP_DECIMALS,
          name: 'Compound',
          symbol: 'COMP'
        }
      }
    }

    // crToken
    if (pool.tokens.crToken) {
      const crTokenData =
        firstBatchValues[getCrTokenBatchName(pool.prizePool.address, pool.tokens.crToken.address)]
      formattedPoolChainData.tokens = {
        ...formattedPoolChainData.tokens,
        crToken: {
          ...formattedPoolChainData?.tokens?.crToken,
          supplyRatePerBlock: crTokenData.supplyRatePerBlock[0]
        }
      }

      const creamComptrollerKey = getCreamComptrollerName(pool.prizePool.address)
      formattedPoolChainData.prize.yield = {
        [YIELD_SOURCES.cream]: {
          unclaimedAmountUnformatted: firstBatchValues[creamComptrollerKey].compAccrued[0],
          unclaimedAmount: formatUnits(
            firstBatchValues[creamComptrollerKey].compAccrued[0],
            CREAM_DECIMALS
          )
        }
      }

      formattedPoolChainData.tokens.cream = {
        address: CUSTOM_CONTRACT_ADDRESSES[NETWORK.mainnet].CREAM,
        decimals: CREAM_DECIMALS,
        name: 'Cream',
        symbol: 'CREAM'
      }
    }

    // Add POOL to ensure we return USD value for pPOOL drips
    if (formattedPoolChainData.tokens && chainId === NETWORK.mainnet) {
      formattedPoolChainData.tokens.pool = {
        address: CUSTOM_CONTRACT_ADDRESSES[NETWORK.mainnet].POOL,
        decimals: POOL_DECIMALS,
        name: 'PoolTogether',
        symbol: 'POOL'
      }
    }

    // LootBox
    const lootBoxAddress = contractAddresses[chainId]?.lootBox?.toLowerCase()
    if (lootBoxAddress && pool.prize.externalErc721Awards.length > 0) {
      const lootBoxes = remove(
        pool.prize.externalErc721Awards,
        (erc721) => erc721.address === lootBoxAddress
      )
      if (lootBoxes && lootBoxes.length > 0) {
        const lootBoxId = lootBoxes[0].id
        const computedAddress =
          firstBatchValues[getLootBoxBatchName(lootBoxAddress, lootBoxId)].computeAddress[0]
        formattedPoolChainData.prize.lootBox = {
          address: computedAddress,
          id: lootBoxId
        }
      }
    }

    // Reserve
    const registryAddress = pool.reserve.registry.address
    if (registryAddress !== ethers.constants.AddressZero) {
      const reserveAddress =
        firstBatchValues[getRegistryBatchName(registryAddress, pool.prizePool.address)].lookup[0]

      formattedPoolChainData.reserve = {
        ...formattedPoolChainData.reserve,
        address: reserveAddress,
        rate: formatUnits(
          secondBatchValues[getReserveBatchName(reserveAddress, prizePoolAddress)]
            .reserveRateMantissa[0],
          DEFAULT_TOKEN_PRECISION
        ),
        rateUnformatted:
          secondBatchValues[getReserveBatchName(reserveAddress, prizePoolAddress)]
            .reserveRateMantissa[0]
      }
    }

    formattedPools[prizePoolAddress] = formattedPoolChainData
  })

  return formattedPools
}

const dripTokenKey = (tokenFaucetAddress, dripTokenAddress) => {
  return `${tokenFaucetAddress}-${dripTokenAddress}`
}
