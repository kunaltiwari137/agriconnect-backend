const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // STEP 1: Get the Authorization header from the incoming request
  const authHeader = req.headers.authorization;

  // STEP 2: If there's no header, or it doesn't start with "Bearer ", reject immediately
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  // STEP 3: Extract just the token part (remove the word "Bearer " and the space)
  const token = authHeader.split(" ")[1];

  try {
    // STEP 4: Verify the token is valid and not expired/tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // STEP 5: Attach the decoded user info to the request object, so later code can use it
    req.user = decoded;

    // STEP 6: Let the request continue to the actual route
    next();

  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;