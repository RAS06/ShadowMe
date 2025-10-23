const jwt = require('jsonwebtoken');

// Simple cookie parser for small use-case (we don't want to add a heavy dependency)
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(pair => {
    const [k, v] = pair.split('=');
    if (!k) return;
    cookies[k.trim()] = decodeURIComponent((v || '').trim());
  });
  return cookies;
}

function authenticateAccessToken(req, res, next) {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No access token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Access token invalid or expired' });
  }
}

// optional - allow route to continue without auth, but set req.user when present
function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (err) {
    // ignore errors; user will be unauthenticated
  }
  return next();
}

module.exports = {
  authenticateAccessToken,
  optionalAuthenticate,
  parseCookies,
};