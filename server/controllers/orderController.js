import Product from "../models/Product.js";
import Order from "../models/Order.js";

import User from "../models/User.js";
import axios from "axios";

// ✅ Place Order (Cash on Delivery)
export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;

    if (!address || !items || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }
      amount += product.offerPrice * item.quantity;
    }

    amount += Math.floor(amount * 0.02);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
      status: "Order Placed",
      isPaid: false,
    });

    await User.findByIdAndUpdate(userId, { cartItems: {} });

    return res.json({ success: true, message: "Order Placed Successfully" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// ✅ Get Orders for Logged-In User
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ✅ Get All Orders (Admin/Seller)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const placeOrderPaystack = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let amount = 0;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.json({
          success: false,
          message: `Product ${item.product} not found`,
        });
      }
      amount += product.offerPrice * item.quantity;
    }

    // Add 2% tax
    amount += Math.floor(amount * 0.02);

    // Create unpaid order
    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "online",
      isPaid: false,
    });

    // PAYSTACK INITIALIZE
    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email, // FIXED ✔ (req.user.email caused error)
        amount: amount * 100, // Convert NGN → Kobo
        metadata: {
          orderId: order._id.toString(),
          userId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      success: true,
      authorization_url: paystackRes.data.data.authorization_url,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// verify payment paystack

export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.body;
    const authUserId = req.userId;

    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = verifyRes.data.data;

    if (data.status !== "success") {
      return res.json({ success: false, message: "Payment not successful" });
    }

    const { orderId, userId } = data.metadata;

    // Ownership check: the authenticated user must own the order
    if (String(userId) !== String(authUserId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (String(order.userId) !== String(authUserId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Idempotent: if already paid, just confirm
    if (order.isPaid) {
      return res.json({ success: true, message: "Payment already verified" });
    }

    order.isPaid = true;
    await order.save();

    await User.findByIdAndUpdate(authUserId, { cartItems: {} });

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
