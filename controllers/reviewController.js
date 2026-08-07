// STEP 1: Bring in the database pool
const pool = require("../config/db");

// STEP 2: Buyer creates a review for a completed order
exports.createReview = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;

    if (!order_id || !rating) {
      return res.status(400).json({ error: "order_id and rating are required" });
    }

    // STEP 3: Enforce the 1-5 rating range at the application level too (not just the DB constraint)
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // STEP 4: Find the buyer_id belonging to the logged-in user
    const [buyerRows] = await pool.query("SELECT buyer_id FROM buyers WHERE user_id = ?", [req.user.user_id]);
    if (buyerRows.length === 0) {
      return res.status(403).json({ error: "Only registered buyers can leave reviews" });
    }
    const buyer_id = buyerRows[0].buyer_id;

    // STEP 5: Find the order, and get the farmer_id via the crop it belongs to
    const [orderRows] = await pool.query(
      `SELECT o.*, c.farmer_id FROM orders o JOIN crops c ON o.crop_id = c.crop_id WHERE o.order_id = ?`,
      [order_id]
    );
    if (orderRows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }
    const order = orderRows[0];

    // STEP 6: Confirm this order actually belongs to this buyer
    if (order.buyer_id !== buyer_id) {
      return res.status(403).json({ error: "You can only review your own orders" });
    }

    // STEP 7: Only allow reviews on delivered orders
    if (order.status !== "delivered") {
      return res.status(400).json({ error: "You can only review completed (delivered) orders" });
    }

    // STEP 8: Prevent leaving two reviews for the same order
    const [existing] = await pool.query("SELECT * FROM reviews WHERE order_id = ?", [order_id]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "You already reviewed this order" });
    }

    // STEP 9: Insert the review
    const [result] = await pool.query(
      "INSERT INTO reviews (buyer_id, farmer_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
      [buyer_id, order.farmer_id, order_id, rating, comment || null]
    );

    res.status(201).json({ message: "Review submitted", review_id: result.insertId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit review" });
  }
};

// STEP 10: View all reviews for a specific farmer (public — buyers browsing crops should see this)
exports.getFarmerReviews = async (req, res) => {
  try {
    const { farmer_id } = req.params;

    const [reviews] = await pool.query(
      `SELECT r.rating, r.comment, r.created_at, b.company_name
       FROM reviews r
       JOIN buyers b ON r.buyer_id = b.buyer_id
       WHERE r.farmer_id = ?
       ORDER BY r.created_at DESC`,
      [farmer_id]
    );

    // STEP 11: Also calculate an average rating — useful summary info for the frontend
    const [avgResult] = await pool.query(
      "SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE farmer_id = ?",
      [farmer_id]
    );

    res.json({
      average_rating: avgResult[0].average_rating,
      total_reviews: avgResult[0].total_reviews,
      reviews
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};