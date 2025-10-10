import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Stripe from "stripe";
import User from "../models/User.js";

// ✅ Place Order (Cash on Delivery)
export const placeOrderCOD = async (req, res) => {
  try {
    const userId = req.userId; // ✅ From auth middleware
    const { items, address } = req.body;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    // ✅ Calculate total amount
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      amount += product.offerPrice * item.quantity;
    }

    // ✅ Add 2% tax
    amount += Math.floor(amount * 0.02);

    await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "COD",
      status: "Order Placed",
      isPaid: false,
      createdAt: Date.now(),
    });

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

// ✅ Place Order with Stripe
export const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.userId;
    const { items, address } = req.body;
    const { origin } = req.headers;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid data" });
    }

    let amount = 0;
    let productData = [];

    // ✅ Collect product data & calculate total
    for (const item of items) {
      const product = await Product.findById(item.product);
      productData.push({
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });
      amount += product.offerPrice * item.quantity;
    }

    // ✅ Add 2% tax
    amount += Math.floor(amount * 0.02);

    // ✅ Save order
    const order = await Order.create({
      userId,
      items,
      amount,
      address,
      paymentType: "online",
      isPaid: false,
    });

    // ✅ Stripe Gateway initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    // ✅ Line items for Stripe Checkout
    const line_items = productData.map((item) => ({
      price_data: {
        currency: "ngn",
        product_data: {
          name: item.name,
        },
        unit_amount: Math.floor(item.price * 100), // Convert to kobo
      },
      quantity: item.quantity,
    }));

    // ✅ Create Stripe Checkout Session
    const session = await stripeInstance.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId,
      },
    });

    return res.json({ success: true, url: session.url });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// stripe webhooks to verify payment action : / stripe
export const stripeWebhooks = async (request, response) => {
  // Stripe Gateway initialize
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

  const sig = request.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const { orderId, userId } = session.metadata;

      // Mark payment as paid
      await Order.findByIdAndUpdate(orderId, { isPaid: true });

      // Clear user cart
      await User.findByIdAndUpdate(userId, { cartItems: {} });
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const { orderId } = session.metadata;

      // Delete unpaid order
      await Order.findByIdAndDelete(orderId);
      break;
    }

    default:
      console.error(`unhandled event type ${event.type}`);
      break;
  }

  response.json({ received: true });
};
