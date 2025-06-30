// api/meta.js

import redisClient from './cache/redisClient.js';
import fetch from 'node-fetch';

const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;

export default async function handler(req, res) {
  const { uid, id } = req.query; // uid = user ID, id = IMDb ID (ex: tt0133093)

  if (!uid || !id) {
    return res.status(400).json({ error: 'Parâmetros uid e id são obrigatórios.' });
  }

  try {
    // Verifica se existe refresh_token no Redis pra esse UID
    const refreshToken = await redisClient.get(uid);

    if (!refreshToken) {
      console.warn(`Nenhum refresh_token encontrado para UID ${uid}`);
      return res.status(200).json({ id, isWatched: false });
    }

    // Troca refresh_token por access_token
    const tokenRes = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: TRAKT_CLIENT_ID
      })
    });

    if (!tokenRes.ok) {
      const error = await tokenRes.json();
      console.error('Erro ao obter access_token:', error);
      return res.status(500).json({ error: 'Erro ao renovar token Trakt', details: error });
    }

    const { access_token } = await tokenRes.json();

    // Consulta se o filme com ID foi assistido
    const historyRes = await fetch(`https://api.trakt.tv/sync/history/${id}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_CLIENT_ID
      }
    });

    const historyData = await historyRes.json();
    const isWatched = Array.isArray(historyData) && historyData.length > 0;

    return res.status(200).json({ id, isWatched });

  } catch (err) {
    console.error('Erro inesperado no /meta:', err);
    return res.status(500).json({ error: 'Erro interno', message: err.message });
  }
}

