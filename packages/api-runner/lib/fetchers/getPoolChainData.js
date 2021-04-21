import remove from 'lodash.remove'
import { ethers } from 'ethers'
import { formatUnits } from '@ethersproject/units'
import { contract } from '@pooltogether/etherplex'
import { contractAddresses } from '@pooltogether/current-pool-data'

import PrizePoolAbi from '@pooltogether/pooltogether-contracts/abis/PrizePool'
import PrizeStrategyAbi from '@pooltogether/pooltogether-contracts/abis/PeriodicPrizeStrategy'
import TokenFaucetABI from '@pooltogether/pooltogether-contracts/abis/TokenFaucet'
import MultipleWinnersAbi from '@pooltogether/pooltogether-contracts/abis/MultipleWinners'
import RegistryAbi from '@pooltogether/pooltogether-contracts/abis/Registry'
import ReserveAbi from '@pooltogether/pooltogether-contracts/abis/Reserve'
import CTokenAbi from '@pooltogether/pooltogether-contracts/abis/CTokenInterface'
import LootBoxControllerAbi from '@pooltogether/loot-box/abis/LootBoxController'

import { SablierAbi } from 'abis/SablierAbi'
import { ERC20Abi } from 'abis/ERC20Abi'
import { CustomERC721Abi as ERC721Abi } from 'abis/CustomERC721'
import { batch } from 'lib/cloudflare-workers-batch'
import {
  ERC20_BLOCK_LIST,
  CUSTOM_CONTRACT_ADDRESSES,
  DEFAULT_TOKEN_PRECISION,
  SECONDS_PER_DAY
} from 'lib/constants'

const getExternalErc20AwardBatchName = (prizePoolAddress, tokenAddress) =>
  `erc20Award-${prizePoolAddress}-${tokenAddress}`
const getSablierErc20BatchName = (prizePoolAddress, streamId) =>
  `sablier-${prizePoolAddress}-${streamId}`
const getErc721BatchName = (prizeAddress, tokenId) => `erc721Award-${prizeAddress}-${tokenId}`
const getCTokenBatchName = (prizeAddress, tokenAddress) => `cToken-${prizeAddress}-${tokenAddress}`
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
 * @param {*} poolContracts
 * @param {*} poolGraphData
 * @returns
 */
export const getPoolChainData = async (chainId, poolGraphData, fetch) => {
  let pool
  let batchCalls = []
  const erc721AwardsToFetchMetadataFor = []

  // First set of calls
  poolGraphData.forEach((graphPool) => {
    pool = getPool(graphPool)

    // Prize Pool
    const prizePoolContract = contract(pool.prizePool.address, PrizePoolAbi, pool.prizePool.address)
    batchCalls.push(prizePoolContract.captureAwardBalance())

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
        .estimateRemainingBlocksToPrize(ethers.utils.parseEther('14'))
    )

    // TODO: Uniswap data

    // Token Listener
    // NOTE: If it's not a token faucet, this will break everything
    if (pool.tokenListener.address) {
      const tokenFaucetContract = contract(
        pool.tokenListener.address,
        TokenFaucetABI,
        pool.tokenListener.address
      )
      batchCalls.push(
        tokenFaucetContract
          .dripRatePerSecond()
          .asset()
          .measure()
      )
    }

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
    if (pool.prize.sablierStream.id) {
      // TODO: Add sablier to contract addresses package
      const sablierContract = contract(
        pool.prize.sablierStream.id,
        SablierAbi,
        CUSTOM_CONTRACT_ADDRESSES[chainId].Sablier
      )
      batchCalls.push(sablierContract.getStream(ethers.BigNumber.from(pool.prize.sablierStream.id)))
    }

    // cToken
    if (pool.tokens.cToken) {
      const cTokenContract = contract(
        getCTokenBatchName(pool.prizePool.address, pool.tokens.cToken.address),
        CTokenAbi,
        pool.tokens.cToken.address
      )
      batchCalls.push(cTokenContract.supplyRatePerBlock())
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
  const firstBatchValues = await batch(chainId, fetch, ...batchCalls)

  batchCalls = []

  // Second set of calls
  poolGraphData.forEach((graphPool) => {
    pool = getPool(graphPool)

    // Prize Pool
    const prizePoolContract = contract(pool.prizePool.address, PrizePoolAbi, pool.prizePool.address)
    // Must be called in a separate multi-call from `captureAwardBalance`
    batchCalls.push(prizePoolContract.reserveTotalSupply())

    // Token faucet drip asset
    const tokenFaucetDripAssetAddress = firstBatchValues[pool?.tokenListener?.address]?.asset[0]
    if (tokenFaucetDripAssetAddress) {
      const dripErc20Contract = contract(
        getExternalErc20AwardBatchName(pool.prizePool.address, tokenFaucetDripAssetAddress),
        ERC20Abi,
        tokenFaucetDripAssetAddress
      )
      batchCalls.push(
        dripErc20Contract
          .balanceOf(pool.tokenListener.address)
          .decimals()
          .symbol()
          .name()
      )
    }

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

  const secondBatchValues = await batch(chainId, fetch, ...batchCalls)

  // Get External Erc721 Metadata (unfortunately many batch calls)
  const additionalBatchedCalls = await Promise.all([
    ...erc721AwardsToFetchMetadataFor.map(async (erc721Award) => ({
      id: getErc721BatchName(erc721Award.address, erc721Award.tokenId),
      uri: await getErc721TokenUri(chainId, fetch, erc721Award.address, erc721Award.tokenId)
    })),
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
          data: await batch(chainId, fetch, prizeStrategyContract.splitExternalErc20Awards())
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

const getErc721TokenUri = async (chainId, fetch, erc721Address, tokenId) => {
  const erc721Contract = contract(
    getErc721BatchName(erc721Address, tokenId),
    ERC721Abi,
    erc721Address
  )
  let tokenURI = await _tryMetadataMethod(
    chainId,
    fetch,
    erc721Address,
    erc721Contract,
    tokenId,
    'tokenURI'
  )

  if (!tokenURI) {
    tokenURI = await _tryMetadataMethod(
      chainId,
      fetch,
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
  fetch,
  contractAddress,
  etherplexTokenContract,
  tokenId,
  method
) => {
  let tokenValues

  try {
    tokenValues = await batch(chainId, fetch, etherplexTokenContract[method](tokenId))

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

    const formattedPoolChainData = {
      config: {
        splitExternalErc20Awards: additionalBatchCalls.find(
          (response) => response.id === prizeStrategyAddress
        )?.data?.[prizeStrategyAddress].splitExternalErc20Awards[0]
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
        estimateRemainingBlocksToPrize: prizeStrategyData.estimateRemainingBlocksToPrize[0]
      },
      reserve: {
        amountUnformatted: secondBatchValues[prizePoolAddress].reserveTotalSupply[0],
        amount: formatUnits(
          secondBatchValues[prizePoolAddress].reserveTotalSupply[0],
          pool.tokens.underlyingToken.decimals
        )
      }
    }

    // Token listener
    if (pool.tokenListener.address) {
      const tokenListenerData = firstBatchValues[pool.tokenListener.address]
      const tokenFaucetDripAssetAddress = tokenListenerData.asset[0]
      const tokenListenerData2 =
        secondBatchValues[
          getExternalErc20AwardBatchName(pool.prizePool.address, tokenFaucetDripAssetAddress)
        ]
      const tokenFaucetDripToken = {
        address: tokenFaucetDripAssetAddress.toLowerCase(),
        amount: formatUnits(tokenListenerData2.balanceOf[0], tokenListenerData2.decimals[0]),
        amountUnformatted: tokenListenerData2.balanceOf[0],
        decimals: tokenListenerData2.decimals[0],
        name: tokenListenerData2.name[0],
        symbol: tokenListenerData2.symbol[0]
      }

      formattedPoolChainData.tokenListener = {
        dripRatePerSecondUnformatted: tokenListenerData.dripRatePerSecond[0],
        measure: tokenListenerData.measure[0]
      }
      formattedPoolChainData.tokenListener.dripRatePerSecond = formatUnits(
        formattedPoolChainData.tokenListener.dripRatePerSecondUnformatted,
        tokenFaucetDripToken.decimals
      )
      formattedPoolChainData.tokenListener.dripRatePerDayUnformatted = formattedPoolChainData.tokenListener.dripRatePerSecondUnformatted.mul(
        SECONDS_PER_DAY
      )
      formattedPoolChainData.tokenListener.dripRatePerDay = formatUnits(
        formattedPoolChainData.tokenListener.dripRatePerDayUnformatted,
        tokenFaucetDripToken.decimals
      )

      formattedPoolChainData.tokens = {
        ...formattedPoolChainData.tokens,
        tokenFaucetDripToken
      }
    }

    // External ERC20 awards
    // NOTE: editing pool graph data here to merge the token amounts in
    // This is undesirable as it goes against the pattern for merging poolChainData & poolGraphData
    // but it is the simplist way to merge the arrays.
    if (pool.prize.externalErc20Awards.length > 0) {
      pool.prize.externalErc20Awards = pool.prize.externalErc20Awards
        .filter((erc20) => !ERC20_BLOCK_LIST[chainId]?.includes(erc20.address))
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
    if (pool.prize.sablierStream.id) {
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
    }

    // LootBox
    const lootBoxAddress = contractAddresses[chainId]?.lootBox?.toLowerCase()
    if (lootBoxAddress && pool.prize.externalErc721Awards.length > 0) {
      const lootBoxes = remove(
        pool.prize.externalErc721Awards,
        (erc721) => erc721.address === lootBoxAddress
      )
      if (lootBoxes) {
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
