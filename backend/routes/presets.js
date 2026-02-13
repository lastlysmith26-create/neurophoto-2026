const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const presetsFile = path.join(__dirname, "../presets/prompts.json");

// Get all presets
router.get("/", (req, res) => {
    try {
        const presets = JSON.parse(fs.readFileSync(presetsFile, "utf-8"));
        res.json(presets);
    } catch (error) {
        res.status(500).json({ error: "Failed to read presets" });
    }
});

// Get specific category
router.get("/:category", (req, res) => {
    try {
        const presets = JSON.parse(fs.readFileSync(presetsFile, "utf-8"));
        const category = presets[req.params.category];

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        res.json(category);
    } catch (error) {
        res.status(500).json({ error: "Failed to read presets" });
    }
});

module.exports = router;
