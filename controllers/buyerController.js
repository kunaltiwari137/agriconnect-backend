// STEP 1: Bring in the database pool
const pool = require("../config/db");

// STEP 2: Create and export an async function called createBuyerProfile
exports.createBuyerProfile = async (req, res) => {
  try {
    // STEP 3: Pull company_name and location from the request body
    const { company_name, location } = req.body;

    // STEP 4: Check if this user already has a buyer profile
    const [existing] = await pool.query("SELECT * FROM buyers WHERE user_id = ?", [req.user.user_id]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Buyer profile already exists" });
    }

    // STEP 5: Insert the new buyer profile, linked to the logged-in user's id
    const [result] = await pool.query(
      "INSERT INTO buyers (user_id, company_name, location) VALUES (?, ?, ?)",
      [req.user.user_id, company_name || null, location || null]
    );

    // STEP 6: Confirm success
    res.status(201).json({ message: "Buyer profile created", buyer_id: result.insertId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create buyer profile" });
  }
};