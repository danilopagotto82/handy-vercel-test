// api/auth.callback.js

import fetch from 'node-fetch';
import redisClient from './cache/redisClient.js';

const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;
const TRAKT_CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET;
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '86400');

export default async function handler(req, res) {
  const { device_code, uid } = req.query;

  if (!device_code || !uid) {
    return res.status(400).json({ error: 'Parâmetros device_code e uid são obrigatórios.' });
  }

  try {
    // Trocar device_code por tokens na Trakt API
    const tokenRes = await fetch('https://api.trakt.tv/oauth/device/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: device_code,
        client_id: TRAKT_CLIENT_ID,
        client_secret: TRAKT_CLIENT_SECRET
      })
    });

    if (!tokenRes.ok) {
      const errorData = await tokenRes.json();
      console.error('Erro ao obter token da Trakt:', errorData);
      return res.status(500).json({ error: 'Erro ao obter token da Trakt', details: errorData });
    }

    const tokenData = await tokenRes.json();
    const { refresh_token } = tokenData;

    if (!refresh_token) {
      return res.status(500).json({ error: 'Trakt não retornou refresh_token' });
    }

    // Armazenar o refresh_token no Redis com TTL
    await redisClient.set(uid, refresh_token, {
      EX: CACHE_TTL_SECONDS
    });

    console.log(`Refresh_token salvo com sucesso para UID ${uid}`);

    return res.status(200).json({ status: 'Autenticado com sucesso!' });

  } catch (err) {
    console.error('Erro interno no /auth/callback:', err);
    return res.status(500).json({ error: 'Erro interno no servidor', message: err.message });
  }
}
