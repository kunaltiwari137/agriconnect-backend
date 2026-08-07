const express = require("express");
const router = express.Router();
const buyerController = require("../controllers/buyerController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/profile", authMiddleware, buyerController.createBuyerProfile);

module.exports = router;