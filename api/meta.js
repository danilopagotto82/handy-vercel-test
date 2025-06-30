// api/meta.js

import redisClient from './cache/redisClient.js';
import fetch from 'node-fetch';

const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;

export default async function handler(req, res) {
  // <-- log de entrada
  console.log('[META] Invoked with query:', req.query);

  try {
    const { uid, id } = req.query;
    if (!uid || !id) {
      return res.status(400).json({ error: 'Parametros uid e id sao obrigatorios.' });
    }

    // seu fluxo normal continua aqui:
    const refreshToken = await redisClient.get(uid);
    if (!refreshToken) {
      console.warn(`[META] sem refresh_token para UID ${uid}`);
      return res.status(200).json({ id, isWatched: false });
    }

    // troca por access_token
    const tokenRes = await fetch('https://api.trakt.tv/oauth/token', { /* … */ });
    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error('[META] Erro ao obter access_token:', err);
      return res.status(500).json({ error: 'Erro ao renovar token', details: err });
    }
    const { access_token } = await tokenRes.json();

    // consulta histórico
    const historyRes = await fetch(`https://api.trakt.tv/sync/history/${id}`, { /* … */ });
    const historyData = await historyRes.json();
    const isWatched = Array.isArray(historyData) && historyData.length > 0;

    return res.status(200).json({ id, isWatched });

  } catch (err) {
    // <-- log de erro completo
    console.error('[META] Error stack:', err);
    return res.status(500).json({ error: 'Erro interno no meta', message: err.message });
  }
}

