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

// Connect DB & Cloudinary
await connectDB();
await connectCloudinary();

// ONLY localhost + frontend origin
const allowedOrigins = [
  "http://localhost:5175", // dev frontend
  "https://molocart.vercel.app", // production frontend
];

// CORS FIRST (must allow cookies)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // postman etc
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// JSON + Cookies
app.use(express.json());
app.use(cookieParser());

// Test route
app.get("/", (req, res) => res.send("API is working!"));

// Main routes
app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

// Start
app.listen(port, () => console.log(`Server running on port ${port}`));
