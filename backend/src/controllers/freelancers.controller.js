const crypto = require("crypto");
const { collection } = require("../data/store");
const AppError = require("../utils/AppError");
const { requireFields, parsePagination } = require("../utils/validators");

// GET /api/freelancers?skill=React&available=true&q=design&page=1&limit=20
async function listFreelancers(req, res) {
  const { skill, available, q } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let results = collection("freelancers").all();

  if (skill) {
    const s = skill.toLowerCase();
    results = results.filter((f) => f.skills.some((sk) => sk.toLowerCase().includes(s)));
  }
  if (available !== undefined) {
    const wantAvailable = available === "true";
    results = results.filter((f) => f.available === wantAvailable);
  }
  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(query) ||
        f.role.toLowerCase().includes(query) ||
        f.skills.some((sk) => sk.toLowerCase().includes(query))
    );
  }

  results.sort((a, b) => b.rating - a.rating);

  const total = results.length;
  const pageData = results.slice(offset, offset + limit);

  res.json({
    data: pageData,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

async function getFreelancer(req, res) {
  const freelancer = collection("freelancers").findById(req.params.id);
  if (!freelancer) throw new AppError("Freelancer not found.", 404);
  res.json({ data: freelancer });
}

// POST /api/freelancers — create the caller's own freelancer profile
async function createFreelancerProfile(req, res) {
  const existing = collection("freelancers").findOne((f) => f.userId === req.user.id);
  if (existing) {
    throw new AppError("You already have a freelancer profile. Use PATCH to update it.", 409);
  }

  const { role, rateAmount, skills, available, color, bio } = req.body;
  requireFields(req.body, ["role", "rateAmount"]);

  const amount = Number(rateAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("rateAmount must be a positive number.", 422);
  }

  const freelancer = collection("freelancers").insert({
    id: `f_${crypto.randomUUID()}`,
    userId: req.user.id,
    name: req.user.name,
    role: String(role).trim(),
    rateAmount: amount,
    rate: `$${amount}/hr`,
    rating: 0,
    reviews: 0,
    skills: Array.isArray(skills) ? skills.filter(Boolean).map(String) : [],
    available: available !== false,
    color: color || "#0F5C4E",
    bio: bio ? String(bio).trim() : "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ data: freelancer });
}

async function updateFreelancerProfile(req, res) {
  const freelancer = collection("freelancers").findById(req.params.id);
  if (!freelancer) throw new AppError("Freelancer profile not found.", 404);
  if (freelancer.userId !== req.user.id) {
    throw new AppError("You can only edit your own freelancer profile.", 403);
  }

  const { role, rateAmount, skills, available, color, bio } = req.body;
  const patch = { updatedAt: new Date().toISOString() };

  if (role !== undefined) patch.role = String(role).trim();
  if (bio !== undefined) patch.bio = String(bio).trim();
  if (color !== undefined) patch.color = color;
  if (available !== undefined) patch.available = Boolean(available);
  if (Array.isArray(skills)) patch.skills = skills.filter(Boolean).map(String);
  if (rateAmount !== undefined) {
    const amount = Number(rateAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError("rateAmount must be a positive number.", 422);
    }
    patch.rateAmount = amount;
    patch.rate = `$${amount}/hr`;
  }

  const updated = collection("freelancers").updateById(freelancer.id, patch);
  res.json({ data: updated });
}

module.exports = {
  listFreelancers,
  getFreelancer,
  createFreelancerProfile,
  updateFreelancerProfile,
};
