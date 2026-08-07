const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express()
app.use(cors());
app.use(express.json());

app.get("/",(req,res) => {
    res.send("AgriConnect API is running")
})

const cropRoutes = require("./routes/cropRoutes");
app.use("/api/crops", cropRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const buyerRoutes = require("./routes/buyerRoutes");
app.use("/api/buyers", buyerRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/reviews", reviewRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT,() => {
    console.log(`Server running on http://localhost:${PORT}`);
});