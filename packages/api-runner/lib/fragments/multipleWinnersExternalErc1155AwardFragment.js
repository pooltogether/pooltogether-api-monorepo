import gql from 'graphql-tag'

export const multipleWinnersExternalErc1155AwardFragment = gql`
  fragment multipleWinnersExternalErc1155AwardFragment on MultipleWinnersExternalErc1155Award {
    id
    address
    tokenIds
  }
`
