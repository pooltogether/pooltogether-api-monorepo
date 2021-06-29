/**
 *
 * @param {*} event
 * @returns
 */
async function getCompound(event) {
  try {
    const CTOKEN_ADDRESSES = [
      '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
      '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
      '0x35a18000230da775cac24873d00ff85bccded550', // cUNI
      '0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4' // cCOMP
    ]

    const response = await fetch('https://api.compound.finance/api/v2/ctoken', {
      method: 'POST',
      body: JSON.stringify({
        addresses: CTOKEN_ADDRESSES
      })
    })
    return await response.json()
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return null
  }
}
