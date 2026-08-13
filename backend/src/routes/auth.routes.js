const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", asyncHandler(ctrl.register));
router.post("/login", asyncHandler(ctrl.login));
router.get("/me", requireAuth, asyncHandler(ctrl.me));

module.exports = router;
