// api/auth.device.js
import axios from 'axios';

export default async function handler(req, res) {
  const { uid } = req.query;
  if (!uid) {
    return res.status(400).json({ error: 'uid é obrigatório' });
  }

  try {
    const { data } = await axios.post(
      'https://api.trakt.tv/oauth/device/code',
      {
        client_id:     process.env.TRAKT_CLIENT_ID,
        client_secret: process.env.TRAKT_CLIENT_SECRET
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return res.status(200).json(data);
  } catch (err) {
    console.error('[AUTH.DEVICE] erro:', err.response?.data || err.message);
    return res
      .status(500)
      .json({ error: 'Erro no Device Flow', details: err.response?.data || err.message });
  }
}
