import { DEFAULT_HEADERS } from '../../utils/constants'
import { log } from '../../utils/sentry'

const { verify } = require('hcaptcha');

/**
 * @param {Event} event
 */
async function handleRequest(event) {
  const request = event.request
  const formData = await request.formData();
  const body = Object.fromEntries(formData);
  const token = body.hCaptchaToken

  verify(secret, token).then(data => console.log(data)).catch(e => console.error(e))

  // H_CAPTCHA_SECRET
  const hCaptchaResponse = await verify(secret, token)
  console.log('hCaptchaResponse')
  console.log(hCaptchaResponse)
  const data = hCaptchaResponse
  console.log('data')
  console.log(data)

  return new Response('ho', {
    status: 200
  })

  // const data = hCaptchaResponse.data

  // let successResponse
  // if (data) {
  //   let responseBody

  //   console.log(data)

  //   if (data.success === true) {
  //     console.log('success!', data);
  //     console.log(data)
  //     responseBody = 'sccess'
  //   } else {
  //     console.log('verification failed');
  //     responseBody = 'fail'
  //   }

  //   successResponse = new Response(responseBody, {
  //     ...DEFAULT_HEADERS,
  //     status: 200
  //   })
  //   successResponse.headers.set('Content-Type', 'text/plain')
    
  // }

  // return successResponse
  
    // })
    // .catch((e) => {
    //   event.waitUntil(log(e, e.request))

    //   console.log('err')

    //   const errorResponse = new Response(`Error`, {
    //     ...DEFAULT_HEADERS,
    //     status: 500
    //   })
    //   errorResponse.headers.set('Content-Type', 'text/plain')

    //   return errorResponse
    // });
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

// export default {
//   async fetch(request) {
//     console.log(request)
    
//     if (request.method === "POST") {
//       return handleRequest(request);
//     }

//     return new Response("Method Not Allowed", { status: 405 });
//   },
// };
