const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const ctrl = require("../controllers/messages.controller");

const router = express.Router();

router.post("/", requireAuth, asyncHandler(ctrl.sendMessage));
router.get("/inbox", requireAuth, asyncHandler(ctrl.inbox));
router.get("/thread/:userId", requireAuth, asyncHandler(ctrl.thread));

module.exports = router;
