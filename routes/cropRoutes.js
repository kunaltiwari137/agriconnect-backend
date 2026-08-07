// STEP 1: Bring in Express
const express = require("express");

// STEP 2: Create the router (mini-app for crop routes)
const router = express.Router();

// STEP 3: Import the controller functions
const cropController = require("../controllers/cropController");

// STEP 4: Import the auth middleware (the "security guard")
const authMiddleware = require("../middleware/authMiddleware");

// STEP 5: GET all available crops — public, no login needed
router.get("/", cropController.getAllCrops);

// STEP 6: GET one specific crop by its ID — public, no login needed
router.get("/:id", cropController.getCropById);

// STEP 7: POST a new crop — must be logged in (authMiddleware runs first)
router.post("/", authMiddleware, cropController.createCrop);

// STEP 8: PUT (update) a crop — must be logged in, ownership checked inside the controller
router.put("/:id", authMiddleware, cropController.updateCrop);

// STEP 9: DELETE a crop — must be logged in, ownership checked inside the controller
router.delete("/:id", authMiddleware, cropController.deleteCrop);

// STEP 10: Export the router so server.js can use it
module.exports = router;