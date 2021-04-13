export const poolGraphData = [
  {
    '0xebfb47a7ad0fd6e57323c8a42b2e5a6a4f68fc1a': {
      config: {
        liquidityCap:
          '115792089237316195423570985008687907853269984665640564039457584007913129639935',
        maxExitFeeMantissa: '0',
        maxTimelockDurationSeconds: '0',
        timelockTotalSupply: '0',
        numberOfWinners: '3',
        prizePeriodSeconds: '604800',
        tokenCreditRates: [
          {
            creditLimitMantissa: '10000000000000000',
            creditRateMantissa: '11574074074',
            id:
              '0xebfb47a7ad0fd6e57323c8a42b2e5a6a4f68fc1a-0x334cbb5858417aee161b53ee0d5349ccf54514cf'
          }
        ]
      },
      prizePool: {
        address: '0xebfb47a7ad0fd6e57323c8a42b2e5a6a4f68fc1a',
        type: 'compound'
      },
      prizeStrategy: {
        address: '0x178969a87a78597d303c47198c66f68e8be67dc2'
      },
      tokens: {
        ticket: {
          address: '0x334cbb5858417aee161b53ee0d5349ccf54514cf',
          decimals: '18',
          name: 'PoolTogether Dai Ticket (Compound)',
          symbol: 'PcDAI',
          totalSupply: '79551306.018276725864302231',
          totalSupplyUnformatted: {
            type: 'BigNumber',
            hex: '0x41cda4f0c1938ac7b48697'
          },
          numberOfHolders: '4791'
        },
        sponsorship: {
          address: '0x0a2e7f69fe9588fa7fba5f5864236883cd4aac6d',
          decimals: '18',
          name: 'PoolTogether Dai Sponsorship (Compound)',
          symbol: 'PDAIS',
          totalSupply: '253821.482766163126362001',
          totalSupplyUnformatted: {
            type: 'BigNumber',
            hex: '0x35bfb0adcbf9568d9f91'
          },
          numberOfHolders: '3'
        },
        underlyingToken: {
          address: '0x6b175474e89094c44da98b954eedeac495271d0f',
          decimals: '18',
          name: 'Dai Stablecoin',
          symbol: 'DAI'
        },
        cToken: {
          address: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643'
        }
      },
      prize: {
        cumulativePrizeNet: '509761545552936193855508',
        currentPrizeId: '25',
        currentState: 'Awarded',
        externalErc20Awards: [
          {
            address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: '18',
            id:
              '0x178969a87a78597d303c47198c66f68e8be67dc2-0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            name: 'Uniswap',
            symbol: 'UNI'
          },
          {
            address: '0x6b175474e89094c44da98b954eedeac495271d0f',
            decimals: '18',
            id:
              '0x178969a87a78597d303c47198c66f68e8be67dc2-0x6b175474e89094c44da98b954eedeac495271d0f',
            name: 'Dai Stablecoin',
            symbol: 'DAI'
          },
          {
            address: '0x6ca105d2af7095b1bceeb6a2113d168dddcd57cf',
            decimals: null,
            id:
              '0x178969a87a78597d303c47198c66f68e8be67dc2-0x6ca105d2af7095b1bceeb6a2113d168dddcd57cf',
            name: 'MyCrypto Membership (1-Month)',
            symbol: 'UDT'
          },
          {
            address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
            decimals: '18',
            id:
              '0x178969a87a78597d303c47198c66f68e8be67dc2-0xc00e94cb662c3520282e6f5717214004a7f26888',
            name: 'Compound',
            symbol: 'COMP'
          }
        ],
        externalErc721Awards: [
          {
            address: '0x4d695c615a7aacf2d7b9c481b66045bb2457dfde',
            id:
              '0x178969a87a78597d303c47198c66f68e8be67dc2-0x4d695c615a7aacf2d7b9c481b66045bb2457dfde',
            tokenIds: ['63']
          }
        ],
        sablierStream: {}
      },
      reserve: {
        registry: {
          address: '0x0000000000000000000000000000000000000000'
        }
      },
      tokenListener: {
        address: '0xf362ce295f2a4eae4348ffc8cdbce8d729ccb8eb'
      }
    }
  }
]
