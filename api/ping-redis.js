import getRedisClient from './cache/redisClient.js';

export default async function handler(req, res) {
  try {
    const client = await getRedisClient();
    await client.set('test-key', '✅ Redis conectado!', { EX: 10 });
    const result = await client.get('test-key');
    return res.status(200).json({ status: 'ok', message: result });
  } catch (err) {
    console.error('[PING REDIS] Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
