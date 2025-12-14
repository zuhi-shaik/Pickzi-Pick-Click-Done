const User = require('../models/User');

module.exports = async function requireAdmin(req, res, next) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId).select('isAdmin');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.isAdmin) return res.status(403).json({ message: 'Admin access required' });

    next();
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};
