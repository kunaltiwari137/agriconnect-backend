const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, reviewController.createReview);
router.get("/farmer/:farmer_id", reviewController.getFarmerReviews);

module.exports = router;