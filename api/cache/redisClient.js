// api/cache/redisClient.js
import { createClient } from 'redis';

let client;

function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
      // opcional: legacyMode: true  
    });

    // evita “Unhandled promise rejections”
    client.on('error', err => console.error('[REDIS] Error', err));

    // conecta de uma vez
    client.connect()
      .then(() => console.log('[REDIS] Connected'))
      .catch(err => console.error('[REDIS] Connect error', err));
  }

  // se já existe mas está fechado, reconecta
  if (!client.isOpen) {
    console.log('[REDIS] Reconectando...');
    await client.connect();
  }

  return client;
}

export default getRedisClient();
