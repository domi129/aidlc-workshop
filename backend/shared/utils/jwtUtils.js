const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '16h';
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '30d';

class JWTUtils {
  static generateAccessToken(payload) {
    return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, {
      expiresIn: ACCESS_EXPIRATION
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, {
      expiresIn: REFRESH_EXPIRATION
    });
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

module.exports = JWTUtils;
