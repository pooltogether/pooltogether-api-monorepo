/**
 *
 * @param {*} event
 * @returns
 */
export async function getAave(event) {
  try {
    const response = await fetch('https://aave-api-v2.aave.com/data/markets-data', {
      method: 'GET'
    })
    return await response.json()
  } catch (e) {
    event.waitUntil(log(e, event.request))
    return null
  }
}
