const jwt = require('jsonwebtoken');
const User = require('../models/User');

const USER_TTL_MS = 60 * 1000;
const userCache = new Map();

const clearUserCache = (id) => {
  if (id) userCache.delete(String(id));
  else userCache.clear();
};

const getCachedUser = async (id) => {
  const key = String(id);
  const hit = userCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.user;

  const doc = await User.findById(key).select('-password').lean();
  if (!doc) {
    userCache.delete(key);
    return null;
  }
  const user = { ...doc, id: String(doc._id) };
  userCache.set(key, { user, expires: Date.now() + USER_TTL_MS });

  if (userCache.size > 500) {
    const now = Date.now();
    for (const [k, v] of userCache) if (v.expires <= now) userCache.delete(k);
  }
  return user;
};

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aetheria_secret_key_12345');

    const user = await getCachedUser(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied, administrator role required' });
  }
};

module.exports = { protect, adminOnly, clearUserCache };