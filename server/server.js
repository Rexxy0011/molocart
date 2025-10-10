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
import { stripeWebhooks } from "./controllers/orderController.js";

const app = express();
const port = process.env.PORT || 4000;

// ✅ Connect to DB & Cloudinary
await connectDB();
await connectCloudinary();

const allowedOrigins = [
  "http://localhost:5176", // local dev (Vite default)
  "http://localhost:5177", // optional (other local ports)
  "http://localhost:5178", // ✅ your mention
  "https://molocart.vercel.app", // deployed frontend
];

// ✅ Stripe Webhook route FIRST (raw body — must come before express.json)
app.post(
  "/api/order/stripe/webhook",
  express.raw({ type: "application/json" }), // ✅ Correct MIME type (was "app.json" before)
  stripeWebhooks
);

// ✅ Normal middlewares AFTER webhook
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ Basic test route
app.get("/", (req, res) => res.send("API is working!"));

// ✅ Main routes
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

// ✅ Start server
app.listen(port, () => console.log(`Server running on port ${port}`));
