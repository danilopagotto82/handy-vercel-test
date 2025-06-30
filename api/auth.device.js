// Inicia o Device Code Flow
const axios = require('axios');
const redis = require('../cache/redisClient');

const TRAKT = 'https://api.trakt.tv';

module.exports = async (req, res) => {
  const { uid } = req.query;
  if (!uid) return res.status(400).json({ error: 'uid required' });

  // 1) Pede o device_code ao Trakt
  const { data } = await axios.post(
    `${TRAKT}/oauth/device/code`,
    { client_id: process.env.TRAKT_CLIENT_ID },
    { headers: { 'Content-Type': 'application/json' } }
  );

  // 2) Guarda `device_code` → `uid` no cache (expira com o código)
  await redis.set(`device:${data.device_code}`, uid, 'EX', data.expires_in);

  // 3) Devolve ao cliente
  res.status(200).json({
    device_code:     data.device_code,
    user_code:       data.user_code,
    verification_url:data.verification_url,
    expires_in:      data.expires_in,
    interval:        data.interval
  });
};
