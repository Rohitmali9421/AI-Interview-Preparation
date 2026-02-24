import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/connection.js";
import UserRoute from "./routes/userRoute.js";

const PORT = process.env.PORT || 5000;
const app = express();
connectDB();

// ----------------- CORS -----------------
app.use(
  cors({
    origin: process.env.CLIENT_URL, // Your frontend URL, e.g., http://localhost:5173
    credentials: true,              // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ----------------- Middlewares -----------------
app.use(cookieParser());
app.use(express.json());

// ----------------- Routes -----------------
app.use("/api/auth", UserRoute);

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running successfully 🚀",
  });
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});