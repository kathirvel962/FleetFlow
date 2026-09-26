const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.get("/", (req, res) => {
    res.json({
        message: "Fleet Flow is running"
    });
});

connectDB();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});