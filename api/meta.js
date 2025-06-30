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

    const redisClient = await getRedisClient();
    const refreshToken = await redisClient.get(uid);
    if (!refreshToken) {
      console.warn(\`[META] sem refresh_token para UID \${uid}\`);
      return res.status(200).json({ id, isWatched: false });
    }

    // renova access token
    const tokenRes = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refresh_token:  refreshToken,
        client_id:      TRAKT_CLIENT_ID,
        client_secret:  TRAKT_CLIENT_SECRET,
        grant_type:     'refresh_token'
      })
    });
    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error('[META] Erro ao renovar token:', err);
      return res.status(500).json({ error: 'Erro ao renovar token', details: err });
    }
    const { access_token } = await tokenRes.json();

    // consulta histórico
    const historyRes = await fetch(\`https://api.trakt.tv/sync/history/\${id}\`, {
      headers: {
        'Content-Type':      'application/json',
        'trakt-api-version': '2',
        'trakt-api-key':     TRAKT_CLIENT_ID,
        Authorization:       \`Bearer \${access_token}\`
      }
    });
    if (!historyRes.ok) {
      console.error('[META] Erro na consulta history:', await historyRes.text());
      return res.status(500).json({ error: 'Erro ao consultar histórico' });
    }
    const historyData = await historyRes.json();
    const isWatched  = Array.isArray(historyData) && historyData.length > 0;

    return res.status(200).json({ id, isWatched });
  } catch (err) {
    console.error('[META] Error stack:', err);
    return res.status(500).json({ error: 'Erro interno no meta', message: err.message });
  }
}
