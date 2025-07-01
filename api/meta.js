import axios from 'axios';
import getRedisClient from './cache/redisClient.js';

const TRAKT_CLIENT_ID     = process.env.TRAKT_CLIENT_ID;
const TRAKT_CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET;

export default async function handler(req, res) {
  console.log('[META] Invoked with query:', req.query);

  try {
    const { uid, id } = req.query;
    if (!uid || !id) {
      return res.status(400).json({ error: 'uid e id são obrigatórios.' });
    }

    const redis = await getRedisClient();
    const refreshToken = await redis.get(uid);

    if (!refreshToken) {
      console.warn(`[META] sem refresh_token para UID ${uid}`);
      return res.status(200).json({ id, isWatched: false });
    }

    // Renova token
    const { data: tokenData } = await axios.post(
      'https://api.trakt.tv/oauth/token',
      {
        refresh_token:  refreshToken,
        client_id:      TRAKT_CLIENT_ID,
        client_secret:  TRAKT_CLIENT_SECRET,
        grant_type:     'refresh_token'
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const access_token = tokenData.access_token;
    if (!access_token) {
      console.error('[META] resposta sem access_token', tokenData);
      throw new Error('Token inválido');
    }

    // Consulta histórico
    const history = await axios.get(
      `https://api.trakt.tv/sync/history/${id}`,
      {
        headers: {
          'Content-Type':      'application/json',
          'trakt-api-version': '2',
          'trakt-api-key':     TRAKT_CLIENT_ID,
          Authorization:       `Bearer ${access_token}`
        }
      }
    );

    const isWatched = Array.isArray(history.data) && history.data.length > 0;
    return res.status(200).json({ id, isWatched });

  } catch (err) {
    console.error('[META] Erro interno:', err);
    return res
      .status(500)
      .json({ error: 'Erro interno no meta', message: err.message });
  }
}

