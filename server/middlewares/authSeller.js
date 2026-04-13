import jwt from "jsonwebtoken";

const authSeller = async (req, res, next) => {
  // Seller token travels in a dedicated header so it doesn't collide with
  // the user's Authorization header on endpoints that may receive both.
  const sellerToken = req.headers["x-seller-token"];

  if (!sellerToken) {
    return res.status(401).json({ success: false, message: "Not Authorized" });
  }
  try {
    const tokenDecode = jwt.verify(sellerToken, process.env.JWT_SECRET);
    if (tokenDecode.email !== process.env.SELLER_EMAIL) {
      return res.status(401).json({ success: false, message: "Not Authorized" });
    }
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export default authSeller;
