import gql from 'graphql-tag'

import { lootBoxFragment } from 'lib/fragments/lootBoxFragment'

export const lootBoxQuery = (number) => {
  let blockFilter = ''

  if (number > 0) {
    blockFilter = `, block: { number: ${number} }`
  }

  return gql`
    query lootBoxQuery($lootBoxAddress: ID!, $tokenIds: [String]!) {
      lootBoxes(
        where: {
          erc721: $lootBoxAddress, # '0x2cb260f1313454386262373773124f6bc912cf28'
          tokenId_in: $tokenIds # '[1, 2] or [1]',
        } ${blockFilter}
      ) {
        ...lootBoxFragment
      }
    }
    ${lootBoxFragment}
  `
}
