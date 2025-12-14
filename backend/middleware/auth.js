const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[0] === 'Bearer' ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    const rawId = decoded.userId || decoded.id || decoded._id;
    const userId = typeof rawId === 'string' ? rawId : rawId?.toString?.();
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = { id: userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
