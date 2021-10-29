import { createVerifier } from "@glenstack/cf-workers-hcaptcha";

import { DEFAULT_HEADERS } from '../../utils/constants'

const handleRequest = async (event) => {
  const request = event.request
  const verify = createVerifier(H_CAPTCHA_SECRET);

  try {
    const payload = await verify(request);

    if (payload.success) {
      const discordInviteToken = 'kalsjd'
      
      return new Response(discordInviteToken, {
        ...DEFAULT_HEADERS,
        status: 200
      })
    } else {
      throw new Error('not verified')
    }
  } catch (e) {
    console.log(e.message)
    return new Response(`Could not verify hCaptcha token: ${e.message}`, {
      ...DEFAULT_HEADERS,
      status: 401,
    });
  }
};

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})
