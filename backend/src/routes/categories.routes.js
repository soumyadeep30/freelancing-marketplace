const express = require("express");
const { CATEGORIES } = require("../utils/validators");

const CATEGORY_COLOR = {
  Design: "#B45309",
  Development: "#1D4ED8",
  Writing: "#9D174D",
  Marketing: "#B45309",
  Video: "#0F766E",
  Audio: "#6D28D9",
};

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ data: CATEGORIES.map((name) => ({ name, color: CATEGORY_COLOR[name] })) });
});

module.exports = router;
