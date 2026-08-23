// This file used to register a duplicate 'club-google' Passport strategy that
// conflicted with the one in ./passport.js (whichever loaded last silently
// overrode the other). The club strategy now lives in ./passport.js alongside
// the student strategy, with a proper *club*@<allowed_domain> email check.
//
// This shim keeps `require('../config/clubPassport')` working for legacy
// callers (routes/clubAuth.js) — it just re-exports the unified module.
module.exports = require('./passport');
