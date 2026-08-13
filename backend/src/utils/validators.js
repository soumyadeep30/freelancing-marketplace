const AppError = require("./AppError");

const CATEGORIES = ["Design", "Development", "Writing", "Marketing", "Video", "Audio"];
const GIG_TYPES = ["Fixed price", "Hourly"];
const PROPOSAL_STATUSES = ["sent", "accepted", "declined", "withdrawn"];

function requireFields(obj, fields) {
  const missing = fields.filter((f) => {
    const v = obj[f];
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  });
  if (missing.length) {
    throw new AppError(`Missing required field(s): ${missing.join(", ")}`, 422);
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

function assertEmail(email) {
  if (!isValidEmail(email)) throw new AppError("Please provide a valid email address.", 422);
}

function assertCategory(category) {
  if (!CATEGORIES.includes(category)) {
    throw new AppError(`Category must be one of: ${CATEGORIES.join(", ")}`, 422);
  }
}

function assertGigType(type) {
  if (!GIG_TYPES.includes(type)) {
    throw new AppError(`Type must be one of: ${GIG_TYPES.join(", ")}`, 422);
  }
}

function parsePagination(query) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > 100) limit = 100;
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = {
  CATEGORIES,
  GIG_TYPES,
  PROPOSAL_STATUSES,
  requireFields,
  isValidEmail,
  assertEmail,
  assertCategory,
  assertGigType,
  parsePagination,
};
