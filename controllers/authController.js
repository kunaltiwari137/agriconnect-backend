// STEP 1: Import the tools this file needs
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

//------------------Signup---------------//

// STEP 2: Create and export an async function called signup
exports.signup = async (req, res) => {
  try {
    // STEP 3: Pull the signup data out of the request body
    const { name, email, password, phone, role } = req.body;

    // STEP 4: Basic validation — reject the request early if required fields are missing
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // STEP 5: Check if a user with this email already exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // STEP 6: Hash the password before storing it — never save plain text passwords
    const password_hash = await bcrypt.hash(password, 10);

    // STEP 7: Insert the new user into the database
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, password_hash, phone || null, role]
    );

    // STEP 8: Send back a success response
    res.status(201).json({ message: "User registered successfully", user_id: result.insertId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
};

//------------------Login---------------//

exports.login = async (req, res) => {
  try {
    // STEP 1: Pull email and password from the request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // STEP 2: Find the user by email
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const user = users[0];

    // STEP 3: Compare the typed password against the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // STEP 4: Generate a JWT containing the user's id and role
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // STEP 5: Send the token back to the client
    res.json({
      message: "Login successful",
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role: user.role }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};