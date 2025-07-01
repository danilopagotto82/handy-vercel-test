import { createClient } from 'redis';

let client;
let connecting;

async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false
      }
    });
    client.on('error', err => console.error('[REDIS] Error', err));
  }

  if (!connecting) {
    connecting = client
      .connect()
      .then(() => console.log('[REDIS] Connected'))
      .catch(err => {
        console.error('[REDIS] Connect error', err);
        throw err;
      });
  }

  await connecting;
  return client;
}

export default getRedisClient;
