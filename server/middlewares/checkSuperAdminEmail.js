// server/middlewares/checkSuperadminEmail.js

const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

function checkSuperadminEmail(req, res, next) {
  if (!req.user || req.user.email !== SUPERADMIN_EMAIL) {
    return res.status(403).json({ error: 'Access denied: Superadmin only' });
  }
  next();
}

module.exports = checkSuperadminEmail;
