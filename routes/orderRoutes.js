const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, orderController.createOrder);
router.get("/my-orders", authMiddleware, orderController.getMyOrders);
router.get("/farmer-orders", authMiddleware, orderController.getFarmerOrders);

module.exports = router;