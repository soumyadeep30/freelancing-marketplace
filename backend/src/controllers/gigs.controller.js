const crypto = require("crypto");
const { collection } = require("../data/store");
const AppError = require("../utils/AppError");
const timeAgo = require("../utils/timeAgo");
const {
  requireFields,
  assertCategory,
  assertGigType,
  parsePagination,
} = require("../utils/validators");

function serializeGig(gig) {
  return { ...gig, posted: timeAgo(gig.createdAt) };
}

// GET /api/gigs?category=Design&q=react&type=Hourly&remote=true&page=1&limit=20
async function listGigs(req, res) {
  const { category, q, type, remote } = req.query;
  const { page, limit, offset } = parsePagination(req.query);

  let results = collection("gigs")
    .all()
    .filter((g) => g.status === "open");

  if (category && category !== "All") {
    results = results.filter((g) => g.category === category);
  }
  if (type) {
    results = results.filter((g) => g.type === type);
  }
  if (remote !== undefined) {
    const wantRemote = remote === "true";
    results = results.filter((g) => g.remote === wantRemote);
  }
  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    results = results.filter(
      (g) =>
        g.title.toLowerCase().includes(query) ||
        g.desc.toLowerCase().includes(query) ||
        g.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = results.length;
  const page_ = results.slice(offset, offset + limit).map(serializeGig);

  res.json({
    data: page_,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
}

async function getGig(req, res) {
  const gig = collection("gigs").findById(req.params.id);
  if (!gig) throw new AppError("Gig not found.", 404);
  res.json({ data: serializeGig(gig) });
}

async function createGig(req, res) {
  const { title, category, budgetAmount, type, desc, tags, remote } = req.body;
  requireFields(req.body, ["title", "category", "budgetAmount", "type", "desc"]);
  assertCategory(category);
  assertGigType(type);

  const amount = Number(budgetAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError("budgetAmount must be a positive number.", 422);
  }

  const gig = collection("gigs").insert({
    id: `g_${crypto.randomUUID()}`,
    clientId: req.user.id,
    title: String(title).trim(),
    category,
    budgetAmount: amount,
    budget: type === "Hourly" ? `$${amount}/hr` : `$${amount.toLocaleString()}`,
    type,
    remote: remote !== false,
    status: "open",
    desc: String(desc).trim(),
    tags: Array.isArray(tags) ? tags.filter(Boolean).map(String) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ data: serializeGig(gig) });
}

function assertOwnsGig(gig, userId) {
  if (gig.clientId !== userId) {
    throw new AppError("You can only modify gigs you posted.", 403);
  }
}

async function updateGig(req, res) {
  const gig = collection("gigs").findById(req.params.id);
  if (!gig) throw new AppError("Gig not found.", 404);
  assertOwnsGig(gig, req.user.id);

  const { title, category, budgetAmount, type, desc, tags, remote, status } = req.body;
  const patch = { updatedAt: new Date().toISOString() };

  if (category !== undefined) {
    assertCategory(category);
    patch.category = category;
  }
  if (type !== undefined) {
    assertGigType(type);
    patch.type = type;
  }
  if (title !== undefined) patch.title = String(title).trim();
  if (desc !== undefined) patch.desc = String(desc).trim();
  if (remote !== undefined) patch.remote = Boolean(remote);
  if (Array.isArray(tags)) patch.tags = tags.filter(Boolean).map(String);
  if (status !== undefined) {
    if (!["open", "closed"].includes(status)) {
      throw new AppError("status must be 'open' or 'closed'.", 422);
    }
    patch.status = status;
  }
  if (budgetAmount !== undefined) {
    const amount = Number(budgetAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError("budgetAmount must be a positive number.", 422);
    }
    const effectiveType = patch.type || gig.type;
    patch.budgetAmount = amount;
    patch.budget = effectiveType === "Hourly" ? `$${amount}/hr` : `$${amount.toLocaleString()}`;
  }

  const updated = collection("gigs").updateById(gig.id, patch);
  res.json({ data: serializeGig(updated) });
}

async function deleteGig(req, res) {
  const gig = collection("gigs").findById(req.params.id);
  if (!gig) throw new AppError("Gig not found.", 404);
  assertOwnsGig(gig, req.user.id);

  collection("gigs").removeById(gig.id);
  // Clean up dependent proposals so the data stays consistent.
  const remainingProposals = collection("proposals").all().filter((p) => p.gigId !== gig.id);
  collection("proposals").replaceAll(remainingProposals);

  res.status(204).send();
}

// GET /api/gigs/:id/proposals — only the gig owner can see who applied
async function listProposalsForGig(req, res) {
  const gig = collection("gigs").findById(req.params.id);
  if (!gig) throw new AppError("Gig not found.", 404);
  assertOwnsGig(gig, req.user.id);

  const proposals = collection("proposals")
    .find((p) => p.gigId === gig.id)
    .map((p) => {
      const freelancer = collection("freelancers").findById(p.freelancerId);
      return { ...p, freelancer };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ data: proposals });
}

module.exports = {
  listGigs,
  getGig,
  createGig,
  updateGig,
  deleteGig,
  listProposalsForGig,
};
