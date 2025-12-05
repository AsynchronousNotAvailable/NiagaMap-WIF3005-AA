const express = require("express");
const router = express.Router();
const favouriteService = require("../services/favouriteService");

// POST /favourites
router.post("/", async (req, res) => {
    try {
        const { user_id, analysis_id } = req.body;
        const favourite = await favouriteService.addFavourite(
            user_id,
            analysis_id
        );
        res.status(201).json(favourite);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /favourites/:user_id
router.get("/:user_id", async (req, res) => {
    try {
        const favourites = await favouriteService.getFavourites(
            req.params.user_id
        );
        res.json(favourites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /favourites
router.delete("/", async (req, res) => {
    try {
        const { user_id, analysis_id } = req.body;
        const removed = await favouriteService.removeFavourite(
            user_id,
            analysis_id
        );
        res.json(removed);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
