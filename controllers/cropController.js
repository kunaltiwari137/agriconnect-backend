// STEP 1: Bring in the database pool so this file can run queries
const pool = require("../config/db");

// STEP 2: Create and export an async function called getAllCrops
exports.getAllCrops = async (req, res) => {
  try {
    // STEP 3: Run a SELECT query to get all available crops
    const [rows] = await pool.query("SELECT * FROM crops WHERE status = 'available'");

    // STEP 4: Send those rows back to whoever called this endpoint
    res.json(rows);

  } catch (error) {
    // STEP 5: If anything above fails, log it and send an error response
     console.error(error);
    res.status(500).json({ error: "Failed to fetch crops" });
  }
};

// Add this below your existing getAllCrops function

// STEP 1: Create and export an async function called createCrop
exports.createCrop = async (req, res) => {
  try {
    // Only take crop details from the body — NOT farmer_id anymore
    const { crop_name, quantity, price, harvest_date, organic, image_url } = req.body;

    if (!crop_name || !quantity || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Look up the farmer_id that belongs to the logged-in user (from the token)
    const [farmerRows] = await pool.query(
      "SELECT farmer_id FROM farmers WHERE user_id = ?",
      [req.user.user_id]
    );

    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can list crops" });
    }

    const farmer_id = farmerRows[0].farmer_id;

    const [result] = await pool.query(
      `INSERT INTO crops (farmer_id, crop_name, quantity, price, harvest_date, organic, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [farmer_id, crop_name, quantity, price, harvest_date || null, organic || false, image_url || null]
    );

    res.status(201).json({ message: "Crop listed successfully", crop_id: result.insertId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create crop" });
  }
};

/////-------- Get a single crop by ID-----/////////

// STEP 1: Create and export an async function called getCropById
exports.getCropById = async (req, res) => {
  try {
    // STEP 2: Express captures the value from the URL (e.g. /api/crops/5) into req.params
    const { id } = req.params;

    // STEP 3: Query the database for the crop with this exact crop_id
    const [rows] = await pool.query("SELECT * FROM crops WHERE crop_id = ?", [id]);

    // STEP 4: If no crop was found, respond with 404 Not Found
    if (rows.length === 0) {
      return res.status(404).json({ error: "Crop not found" });
    }

    // STEP 5: Since crop_id is unique, rows[0] is the single matching crop — send it back
    res.json(rows[0]);

  } catch (error) {
    // STEP 6: Catch any unexpected errors (bad connection, etc.)
    console.error(error);
    res.status(500).json({ error: "Failed to fetch crop" });
  }
};



///// update crop 

// STEP 1: Create and export an async function called updateCrop
exports.updateCrop = async (req, res) => {
  try {
    // STEP 2: Get the crop_id from the URL
    const { id } = req.params;

    // STEP 3: Get the possible new values from the request body
    const { crop_name, quantity, price, harvest_date, organic, image_url, status } = req.body;

    // STEP 4: Check the crop actually exists before doing anything else
    const [existing] = await pool.query("SELECT * FROM crops WHERE crop_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Crop not found" });
    }

    // STEP 5: Find the farmer_id that belongs to the logged-in user (from the JWT)
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can update crops" });
    }

    // STEP 6: Ownership check — does this crop actually belong to this logged-in farmer?
    if (existing[0].farmer_id !== farmerRows[0].farmer_id) {
      return res.status(403).json({ error: "You can only update your own crops" });
    }

    // STEP 7: Update the crop — for each field, use the new value if given, otherwise keep the old one
    await pool.query(
      `UPDATE crops SET crop_name = ?, quantity = ?, price = ?, harvest_date = ?, organic = ?, image_url = ?, status = ?
       WHERE crop_id = ?`,
      [
        crop_name || existing[0].crop_name,
        quantity || existing[0].quantity,
        price || existing[0].price,
        harvest_date || existing[0].harvest_date,
        organic !== undefined ? organic : existing[0].organic,
        image_url || existing[0].image_url,
        status || existing[0].status,
        id
      ]
    );

    // STEP 8: Confirm success
    res.json({ message: "Crop updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update crop" });
  }
};


/////------------ Delete crop -----------------/////

// STEP 1: Create and export an async function called deleteCrop
exports.deleteCrop = async (req, res) => {
  try {
    // STEP 2: Get the crop_id from the URL
    const { id } = req.params;

    // STEP 3: Check the crop actually exists
    const [existing] = await pool.query("SELECT * FROM crops WHERE crop_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Crop not found" });
    }

    // STEP 4: Find the logged-in user's farmer_id, and check ownership in one condition
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0 || existing[0].farmer_id !== farmerRows[0].farmer_id) {
      return res.status(403).json({ error: "You can only delete your own crops" });
    }

    // STEP 5: Delete the crop from the database
    await pool.query("DELETE FROM crops WHERE crop_id = ?", [id]);

    // STEP 6: Confirm success
    res.json({ message: "Crop deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete crop" });
  }
};