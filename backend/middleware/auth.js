const jwt = require('jsonwebtoken');

// parseCookies not needed here because index.js uses cookie-parser; export a tiny helper anyway
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

// Primary middleware to enforce access token presence and validity
function authenticateAccessToken(req, res, next) {
  // Check Authorization header first
  const authHeader = req.header('Authorization');
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  // Fallback: check cookies (cookie-parser middleware should populate req.cookies)
  if (!token && req && req.cookies) {
    token = req.cookies.accessToken || req.cookies.token || null;
  }

  if (!token) {
    return res.status(401).json({ message: 'No access token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Token expired or invalid
    return res.status(401).json({ message: 'Access token invalid or expired' });
  }
}

// optional - allow route to continue without auth, but set req.user when present
function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization');
    let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    if (!token && req && req.cookies) token = req.cookies.accessToken || req.cookies.token || null;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (err) {
    // ignore errors; user remains unauthenticated
  }
  return next();
}

module.exports = {
  authenticateAccessToken,
  optionalAuthenticate,
  parseCookies,
};