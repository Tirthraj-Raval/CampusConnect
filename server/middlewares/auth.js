function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Login required' });
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}

module.exports = { ensureAuthenticated, restrictTo };
