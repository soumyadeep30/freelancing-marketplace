const crypto = require("crypto");
const { collection } = require("../data/store");
const AppError = require("../utils/AppError");
const { PROPOSAL_STATUSES } = require("../utils/validators");

function getCallerFreelancerProfile(userId) {
  const profile = collection("freelancers").findOne((f) => f.userId === userId);
  if (!profile) {
    throw new AppError(
      "You need a freelancer profile before sending proposals. Create one at POST /api/freelancers.",
      403
    );
  }
  return profile;
}

// POST /api/gigs/:gigId/proposals  { message, rate }
async function sendProposal(req, res) {
  const gig = collection("gigs").findById(req.params.gigId);
  if (!gig) throw new AppError("Gig not found.", 404);
  if (gig.status !== "open") throw new AppError("This gig is no longer accepting proposals.", 409);
  if (gig.clientId === req.user.id) {
    throw new AppError("You can't send a proposal to your own gig.", 400);
  }

  const freelancer = getCallerFreelancerProfile(req.user.id);

  const alreadySent = collection("proposals").findOne(
    (p) => p.gigId === gig.id && p.freelancerId === freelancer.id
  );
  if (alreadySent) {
    throw new AppError("You've already sent a proposal for this gig.", 409);
  }

  const proposal = collection("proposals").insert({
    id: `p_${crypto.randomUUID()}`,
    gigId: gig.id,
    freelancerId: freelancer.id,
    freelancerUserId: req.user.id,
    clientId: gig.clientId,
    message: req.body.message ? String(req.body.message).trim() : "",
    rate: req.body.rate ? String(req.body.rate).trim() : gig.budget,
    status: "sent",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({ data: proposal });
}

// GET /api/proposals/mine — proposals the caller (as freelancer) has sent
async function listMyProposals(req, res) {
  const freelancer = collection("freelancers").findOne((f) => f.userId === req.user.id);
  const proposals = freelancer
    ? collection("proposals")
        .find((p) => p.freelancerId === freelancer.id)
        .map((p) => ({ ...p, gig: collection("gigs").findById(p.gigId) }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  res.json({ data: proposals });
}

// PATCH /api/proposals/:id  { status: "accepted" | "declined" }  — gig owner only
async function updateProposalStatus(req, res) {
  const proposal = collection("proposals").findById(req.params.id);
  if (!proposal) throw new AppError("Proposal not found.", 404);

  const gig = collection("gigs").findById(proposal.gigId);
  if (!gig || gig.clientId !== req.user.id) {
    throw new AppError("Only the gig owner can update a proposal's status.", 403);
  }

  const { status } = req.body;
  if (!PROPOSAL_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${PROPOSAL_STATUSES.join(", ")}`, 422);
  }

  const updated = collection("proposals").updateById(proposal.id, {
    status,
    updatedAt: new Date().toISOString(),
  });

  res.json({ data: updated });
}

module.exports = { sendProposal, listMyProposals, updateProposalStatus };
