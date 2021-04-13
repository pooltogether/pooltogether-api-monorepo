// import { readProvider } from 'lib/services/readProvider'

// export const useReadProvider = async (chainId) => {
//   const defaultReadProvider = await readProvider(chainId)

//   const isLoaded =
//     defaultReadProvider &&
//     chainId &&
//     Object.keys(defaultReadProvider).length > 0 &&
//     defaultReadProvider?.network?.chainId === chainId
//   console.log('isLoaded')
//   console.log(isLoaded)

//   return {
//     readProvider: defaultReadProvider,
//     isLoaded
//   }
// }
