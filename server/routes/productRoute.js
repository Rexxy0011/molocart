import express from "express";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";
import {
  addProduct,
  changeStock,
  productById,
  productList,
} from "../controllers/productController.js";

const productRouter = express.Router();

// ✅ fix multer array syntax
productRouter.post(
  "/add",

  upload.array(["images"]),
  authSeller,
  addProduct
);

// ✅ matches frontend axios.get("/api/product/list")
productRouter.get("/list", productList);

// ✅ matches frontend axios.get(`/api/product/${id}`)
productRouter.get("/id", productById);

// ✅ matches frontend axios.post("/api/product/stock")
productRouter.post("/stock", authSeller, changeStock);

export default productRouter;
