const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
const next = require('next');

admin.initializeApp();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, conf: { distDir: '.next' } });
const handle = app.getRequestHandler();

exports.nextServer = onRequest({ maxInstances: 1 }, async (req, res) => {
  // Ensure the app is prepared before handling requests
  await app.prepare();
  return handle(req, res);
});
