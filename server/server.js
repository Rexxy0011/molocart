import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import "dotenv/config";
import userRouter from "./routes/userRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import connectCloudinary from "./configs/cloudinary.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRout.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = process.env.PORT || 4000;

// =============================
// CORS CONFIG (EXPRESS v5 SAFE)
// =============================
app.use(
  cors({
    origin: ["http://localhost:5176", "https://molocart.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle OPTIONS for ALL routes (Express v5)
app.options(/.*/, cors());

// =============================
// JSON + Cookies
// =============================
app.use(express.json());
app.use(cookieParser());

// =============================
// Connect DB & Cloudinary
// =============================
await connectDB();
await connectCloudinary();

// =============================
// Test Route
// =============================
app.get("/", (req, res) => res.send("API is working!"));

// =============================
// Main Routes
// =============================
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

// =============================
// Start Server
// =============================
app.listen(port, () => console.log(`Server running on port ${port}`));
