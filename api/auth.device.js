// api/auth.device.js
import axios from 'axios';
import getRedisClient from './cache/redisClient.js';

const TRAKT_CLIENT_ID     = process.env.TRAKT_CLIENT_ID;
const TRAKT_CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET;

export default async function handler(req, res) {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'uid é obrigatório' });
  }

  try {
    // 1) Request device code
    const { data } = await axios.post(
      'https://api.trakt.tv/oauth/device/code',
      {
        client_id:     TRAKT_CLIENT_ID,
        client_secret: TRAKT_CLIENT_SECRET
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // 2) Retorne o device flow info ao cliente
    return res.status(200).json(data);
  } catch (err) {
    console.error('[AUTH.DEVICE] erro no device flow:', err.response?.data || err);
    return res
      .status(500)
      .json({ error: 'Erro ao iniciar o Device Flow', message: err.message });
  }
}
