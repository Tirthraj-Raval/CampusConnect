module.exports = function verifyClubAccess(req, res, next) {
  console.log("🔍 Middleware hit");

  if (!req.isAuthenticated()) {
    console.log("❌ Not authenticated");
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = req.user;
//   console.log("✅ Authenticated user:", user);

  // ✅ Validate club type
  if (user.type !== 'club') {
    console.log("❌ Not a club user");
    return res.status(403).json({ error: 'Access denied: not a club user' });
  }

  const clubIdFromRoute = (req.params.clubId || '').trim().toLowerCase();
  const loggedInClubId = (user.id || '').trim().toLowerCase();

  console.log("🆔 Route clubId:", clubIdFromRoute);
  console.log("🆔 Logged in clubId:", loggedInClubId);

  if (clubIdFromRoute !== loggedInClubId) {
    console.log("❌ Club ID mismatch");
    return res.status(403).json({ error: 'Unauthorized: Club ID mismatch' });
  }

  next(); // ✅ All good
};
