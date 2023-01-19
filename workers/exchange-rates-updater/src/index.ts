import { handleRequest } from './requestHandler'
import { handleScheduled } from './scheduledHandler'
import { log } from '../../../utils/sentry'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event))
})

addEventListener('scheduled', (event) => {
  try {
    event.waitUntil(handleScheduled(event))
  } catch (e) {
    event.waitUntil(log(e, event))
  }
})
