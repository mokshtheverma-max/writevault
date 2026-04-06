const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'writevault-dev-secret-change-in-prod';
const JWT_EXPIRY = '30d';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
