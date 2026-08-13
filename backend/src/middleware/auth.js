const jwt = require("jsonwebtoken");
const config = require("../config");
const AppError = require("../utils/AppError");
const { collection } = require("../data/store");

function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

// Requires a valid Bearer token. Populates req.user (without passwordHash).
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new AppError("Authentication required. Send an Authorization: Bearer <token> header.", 401));
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return next(new AppError("Invalid or expired token.", 401));
  }

  const user = collection("users").findById(payload.sub);
  if (!user) return next(new AppError("The user for this token no longer exists.", 401));

  const { passwordHash, ...safeUser } = user;
  req.user = safeUser;
  next();
}

// Populates req.user if a valid token is present, but never blocks the request.
function attachUserIfPresent(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme === "Bearer" && token) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = collection("users").findById(payload.sub);
      if (user) {
        const { passwordHash, ...safeUser } = user;
        req.user = safeUser;
      }
    } catch (err) {
      // ignore invalid tokens on optional-auth routes
    }
  }
  next();
}

module.exports = { signToken, requireAuth, attachUserIfPresent };
