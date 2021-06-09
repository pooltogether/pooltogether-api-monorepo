import cloneDeep from 'lodash.clonedeep'

// NOTE: address for chainId 1 is just aave v2, we may need to expand in the future
const AAVE_POOL_ADDRESSES = {
  1: '0xb53c1a33016b2dc2ff3653530bff1848a515c8c5',
  137: '0xd05e3e715d945b59290df0ae8ef85c1bdb684744'
}

export const YIELD_SOURCES = Object.freeze({
  aave: 'aave',
  comp: 'comp',
  sushi: 'sushi'
})

export const KNOWN_YIELD_SOURCE_ADDRESSES = Object.freeze({
  1: {
    [YIELD_SOURCES.aave]: [
      '0x858415fdb262f17f7a63f6b1f6fed7af8308a1a7',
      '0x2ba1e000a381ad42af10c6e33afe5994ee878d72',
      '0x4c8d99b0c7022923ef1a81adb4e4e326f8e91ac9',
      '0x6e159b199423383572b7cb05fbbd54103a827f2b',
      '0xba71a9907e88925f59a3658c3a7618440df6406e'
    ],
    [YIELD_SOURCES.sushi]: []
  },
  137: {
    [YIELD_SOURCES.aave]: [
      '0x3c7cdfb942eb98cce7e4d004e2927788cd9e54fe',
      '0xebed994f97396106f7b3d55c287a6a51128cdbb1',
      '0x2fa36043bc27c8da595f32099f4e8e5ae48cf46e',
      '0xabcea7b7f5ea7929b1df9e3e7241547fe7b7af14',
      '0x46ceb180cd117c333faebd98dbc31bee32e7c116',
      '0x37c7fc5ff5e265ae0fa12d2367fbdda7d22c862c',
      '0x4570ab872ebf376cabbbb0cbecb985dfe2757900',
      '0xd06814ac6cd4a5192e3767a7329a731a3d2e3f1c'
    ],
    [YIELD_SOURCES.sushi]: []
  }
})

/**
 *
 * @param {*} chainId
 * @param {*} _pools
 * @returns
 */
export const getCustomYieldSourceData = async (chainId, _pools, fetch) => {
  let pools = determineCustomYieldSources(chainId, _pools)
  pools = await fetchYieldSourceDataForAllPools(chainId, pools, fetch)

  return pools
}

// Utils

const determineCustomYieldSources = (chainId, _pools) =>
  _pools.map((_pool) => {
    const pool = cloneDeep(_pool)
    if (!pool.prizePool.yieldSource) return pool
    pool.prizePool.yieldSource.type = determineYieldSource(chainId, pool)
    return pool
  })

const determineYieldSource = (chainId, pool) => {
  const yieldSources = KNOWN_YIELD_SOURCE_ADDRESSES[chainId]
  if (!yieldSources) return undefined
  if (pool.tokens.cToken) {
    return YIELD_SOURCES.comp
  } else {
    const yieldSourceAddress = pool.prizePool.yieldSource?.address
    if (!yieldSourceAddress) return undefined
    const yieldSourceKeys = Object.keys(KNOWN_YIELD_SOURCE_ADDRESSES[chainId])
    return yieldSourceKeys.find((key) => yieldSources[key].includes(yieldSourceAddress))
  }
}

const fetchYieldSourceDataForAllPools = async (chainId, _pools, fetch) => {
  const uniqueYieldSources = [
    ...new Set(_pools.map((_pool) => _pool.prizePool?.yieldSource?.type).filter(Boolean))
  ]

  const poolsWithYieldSourceDataByYieldSource = await Promise.all(
    uniqueYieldSources.map(async (yieldSource) => {
      try {
        const relevantPools = _pools.filter(
          (_pool) => _pool.prizePool?.yieldSource?.type === yieldSource
        )
        const pools = await getPoolsWithYieldSourceData(chainId, yieldSource, relevantPools, fetch)
        return {
          [yieldSource]: pools
        }
      } catch (e) {
        console.warn(e.message)
        return {}
      }
    })
  )

  const flatPoolsWithYieldSourceData = poolsWithYieldSourceDataByYieldSource
    .map((keyedPools) => Object.values(keyedPools))
    .flat(2)

  return _pools.map((_pool) => {
    const poolWithYieldSourceData = flatPoolsWithYieldSourceData.find(
      (pool) => pool.prizePool.address === _pool.prizePool.address
    )
    return poolWithYieldSourceData || _pool
  })
}

const getPoolsWithYieldSourceData = async (chainId, yieldSource, _pools, fetch) => {
  switch (yieldSource) {
    case YIELD_SOURCES.aave: {
      return await getPoolsWithAaveYieldSourceData(chainId, _pools, fetch)
    }
    default: {
      return Promise.resolve(null)
    }
  }
}

// Custom yield source data fetching

const getPoolsWithAaveYieldSourceData = async (chainId, _pools, fetch) => {
  try {
    // console.log('getting aave')
    const response = await fetch('https://aave-api-v2.aave.com/data/markets-data', {
      method: 'GET'
    })
    const aaveMarketData = await response.json()
    const aavePoolAddress = AAVE_POOL_ADDRESSES[chainId]
    // console.log('aave response')

    return _pools.map((_pool) => {
      const underlyingToken = _pool.tokens.underlyingToken
      const relevantMarketData = aaveMarketData.reserves.find(
        (market) => market.id === getAaveMarketId(underlyingToken.address, aavePoolAddress)
      )
      if (!relevantMarketData) return _pool
      const pool = cloneDeep(_pool)
      pool.prizePool.yieldSource.apy = relevantMarketData.liquidityRate
      pool.prizePool.yieldSource[YIELD_SOURCES.aave] = {
        additionalApy: relevantMarketData.aIncentivesAPY
      }
      return pool
    })
  } catch (e) {
    console.error(e.message)
    return _pools
  }
}

const getAaveMarketId = (underlyingAssetAddress, poolAddress) =>
  `${underlyingAssetAddress}${poolAddress}`
