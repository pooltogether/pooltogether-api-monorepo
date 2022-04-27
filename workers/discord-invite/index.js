import { createVerifier } from '@glenstack/cf-workers-hcaptcha'

import { DEFAULT_HEADERS } from '../../utils/constants'

const CHANNEL_ID = '833035365979652137'

const generateInvite = async () => {
  const url = `https://discord.com/api/v8/channels/${CHANNEL_ID}/invites`

  const response = await fetch(url, {
    body: JSON.stringify({
      max_uses: 1,
      unique: true
    }),
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bot ${DISCORD_BOT_TOKEN}`
    }
  })

  const responseJson = await response.json()

  return responseJson.code
}

const handleGenerateInvite = async (request) => {
  const verify = createVerifier(H_CAPTCHA_SECRET)

  try {
    const payload = await verify(request)

    if (payload.success) {
      return await generateInvite()
    } else {
      throw new Error('not verified')
    }
  } catch (e) {
    console.log(e.message)
    return new Response(`Could not verify hCaptcha token: ${e.message}`, {
      ...DEFAULT_HEADERS,
      status: 401
    })
  }
}

const handleRequest = async (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (url.pathname == '/generateInvite') {
    const discordInviteToken = await handleGenerateInvite(request)

    return new Response(JSON.stringify(discordInviteToken), {
      ...DEFAULT_HEADERS,
      status: 200
    })
  } else if (url.pathname == '/install') {
    return new Response(null, {
      headers: {
        location: `https://discord.com/oauth2/authorize?client_id=${DISCORD_APPLICATION_ID}&permissions=1&scope=bot`
      },
      status: 302
    })
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})
