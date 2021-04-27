'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var units = require('@ethersproject/units');
var currentPoolData = require('@pooltogether/current-pool-data');
var constants = require('../constants.js');
var useSubgraphClients = require('../hooks/useSubgraphClients.js');
var prizePoolsQuery = require('../queries/prizePoolsQuery.js');
var ethers = require('ethers');

/**
 *
 * @param {*} chainId
 * @param {*} poolContracts
 * @param {*} blockNumber
 * @returns
 */

const getPoolGraphData = async (chainId, poolContracts, fetch, blockNumber = -1) => {
  const subgraphVersions = useSubgraphClients.getSubgraphVersionsFromContracts(poolContracts);
  const subgraphClients = useSubgraphClients.getSubgraphClientsByVersionFromContracts(poolContracts, chainId, fetch);
  const addressesByVersion = useSubgraphClients.getPoolAddressesBySubgraphVersionFromContracts(poolContracts);
  const query = prizePoolsQuery.prizePoolsQuery(blockNumber);
  const data = await Promise.all(subgraphVersions.map(version => {
    const client = subgraphClients[version];
    const poolAddresses = addressesByVersion[version];
    return client.request(query, {
      poolAddresses
    }).catch(e => {
      console.error(e);
      return null;
    });
  }));
  return data.filter(Boolean).flatMap(({
    prizePools
  }) => prizePools.map(prizePool => ({
    [prizePool.id]: formatPoolGraphData(prizePool, chainId)
  })));
};

const formatPoolGraphData = (prizePool, chainId) => {
  var _prizePool$sablierStr;

  const prizeStrategy = prizePool.prizeStrategy.multipleWinners ? prizePool.prizeStrategy.multipleWinners : prizePool.prizeStrategy.singleRandomWinner;
  const ticket = prizeStrategy.ticket;
  const sponsorship = prizeStrategy.sponsorship; // Filter out our PTLootBox erc721

  const externalErc20Awards = prizeStrategy.externalErc20Awards.filter(award => {
    var _contractAddresses$ch, _contractAddresses$ch2;

    const lootboxAddress = (_contractAddresses$ch = currentPoolData.contractAddresses[chainId]) === null || _contractAddresses$ch === void 0 ? void 0 : (_contractAddresses$ch2 = _contractAddresses$ch.lootBox) === null || _contractAddresses$ch2 === void 0 ? void 0 : _contractAddresses$ch2.toLowerCase();

    if (lootboxAddress) {
      return award.address !== lootboxAddress;
    }

    return true;
  });
  const formattedData = {
    config: {
      liquidityCap: prizePool.liquidityCap,
      maxExitFeeMantissa: prizePool.maxExitFeeMantissa,
      maxTimelockDurationSeconds: prizePool.maxTimelockDuration,
      timelockTotalSupply: prizePool.timelockTotalSupply,
      numberOfWinners: (prizeStrategy === null || prizeStrategy === void 0 ? void 0 : prizeStrategy.numberOfWinners) || '1',
      prizePeriodSeconds: prizeStrategy.prizePeriodSeconds,
      tokenCreditRates: prizePool.tokenCreditRates
    },
    prizePool: {
      address: prizePool.id
    },
    prizeStrategy: {
      address: prizePool.prizeStrategy.id
    },
    tokens: {
      ticket: {
        address: ticket.id,
        decimals: ticket.decimals,
        name: ticket.name,
        symbol: ticket.symbol,
        totalSupply: units.formatUnits(ticket.totalSupply, ticket.decimals),
        totalSupplyUnformatted: ethers.ethers.BigNumber.from(ticket.totalSupply),
        numberOfHolders: ticket.numberOfHolders
      },
      sponsorship: {
        address: sponsorship.id,
        decimals: sponsorship.decimals,
        name: sponsorship.name,
        symbol: sponsorship.symbol,
        totalSupply: units.formatUnits(sponsorship.totalSupply, sponsorship.decimals),
        totalSupplyUnformatted: ethers.ethers.BigNumber.from(sponsorship.totalSupply),
        numberOfHolders: sponsorship.numberOfHolders
      },
      underlyingToken: {
        address: prizePool.underlyingCollateralToken,
        decimals: prizePool.underlyingCollateralDecimals,
        name: prizePool.underlyingCollateralName,
        symbol: prizePool.underlyingCollateralSymbol
      }
    },
    prize: {
      cumulativePrizeNet: prizePool.cumulativePrizeNet,
      currentPrizeId: prizePool.currentPrizeId,
      currentState: prizePool.currentState,
      externalErc20Awards,
      externalErc721Awards: prizeStrategy.externalErc721Awards,
      sablierStream: {
        id: (_prizePool$sablierStr = prizePool.sablierStream) === null || _prizePool$sablierStr === void 0 ? void 0 : _prizePool$sablierStr.id
      }
    },
    reserve: {
      registry: {
        // TODO: Remove. Hardcoded for a bug in the subgraph.
        address: prizePool.reserveRegistry === ethers.ethers.constants.AddressZero && chainId === 1 ? '0x3e8b9901dbfe766d3fe44b36c180a1bca2b9a295' : prizePool.reserveRegistry
      }
    },
    tokenListener: {
      address: prizeStrategy.tokenListener
    }
  };

  if (prizePool.compoundPrizePool) {
    formatCompoundPrizePoolData(prizePool, formattedData);
  } else if (prizePool.yieldSourcePrizePool) {
    formatGenericYieldPrizePoolData(prizePool, formattedData);
  } else {
    formatStakePrizePoolData(prizePool, formattedData);
  }

  return formattedData;
};

const formatCompoundPrizePoolData = (prizePool, formattedData) => {
  formattedData.prizePool.type = constants.PRIZE_POOL_TYPES.compound;
  formattedData.tokens.cToken = {
    address: prizePool.compoundPrizePool.cToken
  };
};

const formatGenericYieldPrizePoolData = (prizePool, formattedData) => {
  formattedData.prizePool.type = constants.PRIZE_POOL_TYPES.genericYield;
  formattedData.prizePool.yieldSource = {
    address: prizePool.yieldSourcePrizePool.yieldSource
  };
};

const formatStakePrizePoolData = (prizePool, formattedData) => {
  formattedData.prizePool.type = constants.PRIZE_POOL_TYPES.stake;
};

exports.getPoolGraphData = getPoolGraphData;
