const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/gigs.controller");
const proposalsCtrl = require("../controllers/proposals.controller");

const router = express.Router();

router.get("/", asyncHandler(ctrl.listGigs));
router.post("/", requireAuth, asyncHandler(ctrl.createGig));
router.get("/:id", asyncHandler(ctrl.getGig));
router.patch("/:id", requireAuth, asyncHandler(ctrl.updateGig));
router.delete("/:id", requireAuth, asyncHandler(ctrl.deleteGig));

router.get("/:id/proposals", requireAuth, asyncHandler(ctrl.listProposalsForGig));
router.post("/:gigId/proposals", requireAuth, asyncHandler(proposalsCtrl.sendProposal));

module.exports = router;
