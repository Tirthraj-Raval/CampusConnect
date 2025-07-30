function ensureAuthenticated(req, res, next) {
  console.log("Checking authentication for user:", req.user);
  console.log("Request received:", req);
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: 'Login required' });
}

function restrictTo(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.type)) {
      console.log("❌ Access denied for user type:", req.user?.type);
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
}

module.exports = { ensureAuthenticated, restrictTo };
