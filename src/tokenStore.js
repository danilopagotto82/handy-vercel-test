// src/tokenStore.js
const axios = require('axios');
const qs    = require('qs');
const redis = require('../cache/redisClient'); // ou use direto aqui

const TRAKT_BASE = 'https://api.trakt.tv';

// Busca do Redis ou da API quais IDs já foram assistidos
async function getWatchedIdsForUser(uid, idList) {
  const cacheKey = `watched:${uid}`;
  let watchedAll = await redis.get(cacheKey);
  if (!watchedAll) {
    // Obtém token de algum lugar (UID → refresh_token armazenado, por ex.)
    const refreshToken = await getRefreshTokenForUser(uid);
    // Troca refresh_token por access_token
    const { access_token } = await axios.post(`${TRAKT_BASE}/oauth/token`, {
      client_id:     process.env.TRAKT_CLIENT_ID,
      client_secret: process.env.TRAKT_CLIENT_SECRET,
      refresh_token,
      redirect_uri:  process.env.TRAKT_REDIRECT_URI,
      grant_type:    'refresh_token'
    }).then(r=>r.data);
    // Busca lista de assistidos
    const resp = await axios.get(`${TRAKT_BASE}/sync/watched/movies`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'trakt-api-version': '2',
        'trakt-api-key':     process.env.TRAKT_CLIENT_ID
      }
    });
    watchedAll = resp.data.map(m=>m.movie.ids.imdb); // ex.: ["tt0109830", ...]
    // Cache por CACHE_TTL_SECONDS
    await redis.set(cacheKey, JSON.stringify(watchedAll), 'EX', parseInt(process.env.CACHE_TTL_SECONDS));
  } else {
    watchedAll = JSON.parse(watchedAll);
  }
  // Filtra só os que estão na idList
  return idList.filter(id => watchedAll.includes(id));
}

module.exports = { getWatchedIdsForUser };
