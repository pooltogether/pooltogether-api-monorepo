import { createVerifier } from '@glenstack/cf-workers-hcaptcha'
// import { Client, Intents } from 'discord.js'

import { DEFAULT_HEADERS } from '../../utils/constants'

// const client = new Client({ intents: [] })

// client.on('ready', () => {
//   console.log(`Ready n' Logged in as ${client.user.tag}!`)
// })

const generateInvite = async () => {
  console.log('in generate')

  // MANAGE_GUILD permission?
  // channel_id 833035365979652137
  const url = `https://discord.com/api/v8/applications/${DISCORD_APPLICATION_ID}/`
  // const url = `https://discord.com/api/v8/applications/${DISCORD_APPLICATION_ID}/commands`
  // const url = `https://discord.com/api/v8/applications/${CLIENT_ID}/guilds/123456789/commands`
  console.log(url)

  const test = await fetch(url, {
    body: JSON.stringify({
      name: 'echo',
      description: 'repeat after me!',
      options: [
        {
          name: 'text',
          description: 'what should I be puppeted to say?',
          type: 3,
          required: true
        }
      ]
    }),
    method: 'POST',
    headers: {
      'content-type': 'application/json'
      // 'authorization': `Bearer ${(await getClientCredentialToken())}`
    }
  })
  console.log('test')
  console.log(test)
  // return new Response('done!');

  // await client.login(DISCORD_APPLICATION_SECRET)
  // const link = client.generateInvite()

  // console.log(`created invite ${link}`)

  // return link
}

const handleGenerateInvite = async (request) => {
  const verify = createVerifier(H_CAPTCHA_SECRET)

  try {
    const payload = await verify(request)

    if (payload.success) {
      const invite = await generateInvite()
      console.log(invite)
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
      status: 401
    })
  }
}

const handleRequest = async (event) => {
  const request = event.request

  const url = new URL(request.url)
  if (url.pathname == '/generateInvite') {
    const invite = await generateInvite()
    // await handleGenerateInvite(request)
  } else if (url.pathname == '/install') {
    return new Response(null, {
      headers: {
        location: `https://discord.com/oauth2/authorize?client_id=${DISCORD_APPLICATION_ID}&scope=guilds.join`
      },
      status: 302
    })
  }
}

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})
