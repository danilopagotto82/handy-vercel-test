// Crie esta pasta/api/cache/redisClient.js
const { createClient } = require('redis');
const client = createClient({ url: process.env.REDIS_URL });
module.exports = {
  connect:   () => client.connect(),
  get:       (k) => client.get(k),
  set:       (k,v, exFlag, ex) => client.set(k,v, exFlag, ex),
  isReady:   () => client.isReady,
  disconnect:() => client.quit()
};
