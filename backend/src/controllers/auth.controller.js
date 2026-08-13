const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { collection } = require("../data/store");
const { signToken } = require("../middleware/auth");
const AppError = require("../utils/AppError");
const { requireFields, assertEmail } = require("../utils/validators");

function toSafeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function register(req, res) {
  const { name, email, password, role } = req.body;
  requireFields(req.body, ["name", "email", "password"]);
  assertEmail(email);

  if (password.length < 8) {
    throw new AppError("Password must be at least 8 characters.", 422);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = collection("users").findOne((u) => u.email === normalizedEmail);
  if (existing) {
    throw new AppError("An account with that email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = collection("users").insert({
    id: `u_${crypto.randomUUID()}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: role === "freelancer" ? "freelancer" : "client",
    createdAt: new Date().toISOString(),
  });

  const token = signToken(user);
  res.status(201).json({ token, user: toSafeUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body;
  requireFields(req.body, ["email", "password"]);

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = collection("users").findOne((u) => u.email === normalizedEmail);
  if (!user) throw new AppError("Invalid email or password.", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password.", 401);

  const token = signToken(user);
  res.json({ token, user: toSafeUser(user) });
}

async function me(req, res) {
  // req.user is already populated (and already stripped of passwordHash) by requireAuth
  const freelancerProfile = collection("freelancers").findOne((f) => f.userId === req.user.id);
  res.json({ user: req.user, freelancerProfile });
}

module.exports = { register, login, me };
