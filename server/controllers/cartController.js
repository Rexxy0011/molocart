import mongoose from "mongoose";
import User from "../models/User.js";

// Update user CartData : /api/cart/update
export const updateCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { cartItems } = req.body;

    if (!cartItems || typeof cartItems !== "object" || Array.isArray(cartItems)) {
      return res.json({ success: false, message: "Invalid cart data" });
    }

    // Only allow { [validObjectId]: positiveInt } entries
    const sanitized = {};
    for (const [id, qty] of Object.entries(cartItems)) {
      if (!mongoose.isValidObjectId(id)) continue;
      const n = Number(qty);
      if (!Number.isInteger(n) || n < 1 || n > 999) continue;
      sanitized[id] = n;
    }

    await User.findByIdAndUpdate(userId, { cartItems: sanitized });

    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
