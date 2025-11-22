import React from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import { useAppContext } from "./context/AppContext";
import Login from "./components/Login";
import AllProducts from "./pages/AllProducts";
import ProductCategory from "./pages/ProductCategory";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import AddAddress from "./pages/AddAddress";
import Myorders from "./pages/MyOrders";
import SellerLogin from "./components/seller/SellerLogin";
import SellerLayout from "./pages/seller/SellerLayout";
import AddProduct from "./pages/seller/AddProduct";
import ProductList from "./pages/seller/ProductList";
import Orders from "./pages/seller/Orders";
import PaymentSuccess from "./pages/PaymentSuccess";
import Loading from "./components/Loading";

const ProtectedRoute = ({ children }) => {
  const { user, setShowUserLogin } = useAppContext();

  if (!user) {
    setShowUserLogin(true);
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const isSellerPath = useLocation().pathname.includes("/seller");
  const { showUserLogin, isSeller } = useAppContext();

  return (
    <div className="text-default min-h-screen text-gray-700 bg-white">
      {isSellerPath ? null : <Navbar />}
      {showUserLogin ? <Login /> : null}

      <Toaster />
      <div
        className={`${isSellerPath ? "" : "px-6 md:px-16 lg:px-24 xl:px-32"}`}
      >
        <Routes>
          {/* 🏠 Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/products/:category" element={<ProductCategory />} />
          <Route path="/products/:category/:id" element={<ProductDetails />} />

          {/* 🛒 User Shopping & Orders (Protected) */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-address"
            element={
              <ProtectedRoute>
                <AddAddress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <Myorders />
              </ProtectedRoute>
            }
          />

          {/* 🔄 Stripe/Paystack Redirect Loaders */}
          <Route path="/loader" element={<Loading />} />

          {/* ✅ Newly added Paystack success route */}
          <Route path="/loading" element={<Loading />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />

          {/* 🧾 Seller Routes */}
          <Route
            path="/seller"
            element={isSeller ? <SellerLayout /> : <SellerLogin />}
          >
            <Route index element={isSeller ? <AddProduct /> : null} />
            <Route path="product-list" element={<ProductList />} />
            <Route path="orders" element={<Orders />} />
          </Route>
        </Routes>
      </div>
      {!isSellerPath && <Footer />}
    </div>
  );
};

export default App;
