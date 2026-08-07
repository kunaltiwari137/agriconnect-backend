// STEP 1: Bring in the database pool
const pool = require("../config/db");

// STEP 2: Buyer initiates payment for one of their orders
exports.createPayment = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    // STEP 3: Find the buyer_id belonging to the logged-in user
    const [buyerRows] = await pool.query("SELECT buyer_id FROM buyers WHERE user_id = ?", [req.user.user_id]);
    if (buyerRows.length === 0) {
      return res.status(403).json({ error: "Only registered buyers can make payments" });
    }
    const buyer_id = buyerRows[0].buyer_id;

    // STEP 4: Find the order and confirm it belongs to this buyer
    const [orderRows] = await pool.query("SELECT * FROM orders WHERE order_id = ?", [order_id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    const order = orderRows[0];

    if (order.buyer_id !== buyer_id) {
      return res.status(403).json({ error: "You can only pay for your own orders" });
    }

    // STEP 5: Prevent paying twice for the same order
    const [existingPayment] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [order_id]);
    if (existingPayment.length > 0) {
      return res.status(409).json({ error: "Payment already exists for this order" });
    }

    // STEP 6: Simulate a payment transaction ID (a real gateway like Razorpay would give you this)
    const transaction_id = "TXN" + Date.now();

    // STEP 7: Insert the payment as 'held' — money committed, not yet released to the farmer
    const [result] = await pool.query(
      "INSERT INTO payments (order_id, amount, payment_status, transaction_id) VALUES (?, ?, 'held', ?)",
      [order_id, order.total_amount, transaction_id]
    );

    // STEP 8: Move the order from 'pending' to 'confirmed' now that payment is secured
    await pool.query("UPDATE orders SET status = 'confirmed' WHERE order_id = ?", [order_id]);

    res.status(201).json({
      message: "Payment successful, held in escrow",
      payment_id: result.insertId,
      transaction_id
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Payment failed" });
  }
};

// STEP 9: Farmer updates order status; if marked 'delivered', automatically release payment
exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_id } = req.params;
    const { status } = req.body;

    const validStatuses = ["confirmed", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // STEP 10: Find the farmer_id belonging to the logged-in user
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can update order status" });
    }
    const farmer_id = farmerRows[0].farmer_id;

    // STEP 11: Confirm this order is actually for one of this farmer's crops
    const [orderRows] = await pool.query(
      `SELECT o.*, c.farmer_id FROM orders o JOIN crops c ON o.crop_id = c.crop_id WHERE o.order_id = ?`,
      [order_id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (orderRows[0].farmer_id !== farmer_id) {
      return res.status(403).json({ error: "You can only update orders on your own crops" });
    }

    // STEP 12: Update the order's status
    await pool.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, order_id]);

    // STEP 13: If delivered, release the held payment to the farmer
    if (status === "delivered") {
      await pool.query("UPDATE payments SET payment_status = 'released' WHERE order_id = ?", [order_id]);
    }

    res.json({ message: `Order status updated to '${status}'` });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

// STEP 14: View the payment for a specific order (either the buyer or the farmer can check)
exports.getPaymentByOrder = async (req, res) => {
  try {
    const { order_id } = req.params;

    const [payments] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [order_id]);
    if (payments.length === 0) {
      return res.status(404).json({ error: "No payment found for this order" });
    }

    res.json(payments[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
};