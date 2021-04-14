import gql from 'graphql-tag'

import { prizeStrategyFragment } from 'lib/fragments/prizeStrategyFragment'
import { prizePoolAccountFragment } from 'lib/fragments/prizePoolAccountFragment'
import { controlledTokenFragment } from 'lib/fragments/controlledTokenFragment'

export const prizePoolFragment = gql`
  fragment prizePoolFragment on PrizePool {
    id

    prizeStrategy {
      ...prizeStrategyFragment
    }

    compoundPrizePool {
      id
      cToken
    }

    stakePrizePool {
      id
      stakeToken
    }

    yieldSourcePrizePool {
      id
      yieldSource
    }

    sablierStream {
      id
    }

    underlyingCollateralToken
    underlyingCollateralDecimals
    underlyingCollateralName
    underlyingCollateralSymbol

    maxExitFeeMantissa
    maxTimelockDuration
    timelockTotalSupply
    liquidityCap

    reserveRegistry

    cumulativePrizeNet

    currentPrizeId
    currentState

    tokenCreditRates {
      id
      creditRateMantissa
      creditLimitMantissa
    }
  }
  ${prizeStrategyFragment}

  ${controlledTokenFragment}
`
// ${prizePoolAccountFragment}
