const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, paymentController.createPayment);
router.get("/order/:order_id", authMiddleware, paymentController.getPaymentByOrder);
router.put("/order/:order_id/status", authMiddleware, paymentController.updateOrderStatus);

module.exports = router;