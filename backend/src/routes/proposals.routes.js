const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/proposals.controller");

const router = express.Router();

router.get("/mine", requireAuth, asyncHandler(ctrl.listMyProposals));
router.patch("/:id", requireAuth, asyncHandler(ctrl.updateProposalStatus));

module.exports = router;
