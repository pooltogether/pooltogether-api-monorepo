import gql from 'graphql-tag'

export const controlledTokenFragment = gql`
  fragment controlledTokenFragment on ControlledToken {
    id
    totalSupply

    name
    symbol
    decimals
    numberOfHolders
  }
`
