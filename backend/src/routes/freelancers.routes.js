const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/freelancers.controller");

const router = express.Router();

router.get("/", asyncHandler(ctrl.listFreelancers));
router.post("/", requireAuth, asyncHandler(ctrl.createFreelancerProfile));
router.get("/:id", asyncHandler(ctrl.getFreelancer));
router.patch("/:id", requireAuth, asyncHandler(ctrl.updateFreelancerProfile));

module.exports = router;
