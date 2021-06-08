import gql from 'graphql-tag'

import { controlledTokenFragment } from 'lib/fragments/controlledTokenFragment'
import { multipleWinnersExternalErc20AwardFragment } from 'lib/fragments/multipleWinnersExternalErc20AwardFragment'
import { multipleWinnersExternalErc721AwardFragment } from 'lib/fragments/multipleWinnersExternalErc721AwardFragment'
import { multipleWinnersExternalErc1155AwardFragment } from 'lib/fragments/multipleWinnersExternalErc1155AwardFragment'

export const multipleWinnersFragment = gql`
  fragment multipleWinnersFragment on MultipleWinnersPrizeStrategy {
    id

    numberOfWinners
    prizePeriodSeconds
    tokenListener

    ticket {
      ...controlledTokenFragment
    }
    sponsorship {
      ...controlledTokenFragment
    }
    externalErc20Awards {
      ...multipleWinnersExternalErc20AwardFragment
    }
    externalErc721Awards {
      ...multipleWinnersExternalErc721AwardFragment
    }
    externalErc1155Awards {
      ...multipleWinnersExternalErc1155AwardFragment
    }
  }
  ${controlledTokenFragment}
  ${multipleWinnersExternalErc20AwardFragment}
  ${multipleWinnersExternalErc721AwardFragment}
  ${multipleWinnersExternalErc1155AwardFragment}
`
