import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

const TOKEN_KEY = "molocart_token";
const SELLER_TOKEN_KEY = "molocart_seller_token";

const getStored = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// Attach whichever token(s) the caller has — server middleware picks the right one.
axios.interceptors.request.use((config) => {
  const userToken = getStored(TOKEN_KEY);
  const sellerToken = getStored(SELLER_TOKEN_KEY);
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  if (sellerToken) {
    config.headers["X-Seller-Token"] = sellerToken;
  }
  return config;
});

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isSeller, setIsSeller] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showUserLogin, setShowUserLogin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [searchQuery, setSearchQuery] = useState({});
  const skipNextCartSync = useRef(false);

  const setUserToken = (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  };

  const setSellerToken = (token) => {
    if (token) localStorage.setItem(SELLER_TOKEN_KEY, token);
    else localStorage.removeItem(SELLER_TOKEN_KEY);
  };

  // Fetch seller status
  const fetchSeller = async () => {
    try {
      const { data } = await axios.get("/api/seller/is-auth");
      setIsSeller(data.success);
    } catch {
      setIsSeller(false);
    }
  };

  // Fetch user + cart
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/is-auth");
      if (data.success) {
        setUser(data.user);
        if (data.user.cartItems) {
          skipNextCartSync.current = true;
          setCartItems(data.user.cartItems);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/product/list");
      if (data.success) {
        setProducts(data.products);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Add to cart (Login protected)
  const addToCart = (itemId) => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      setShowUserLogin(true);
      return;
    }

    let cartData = structuredClone(cartItems);
    cartData[itemId] = (cartData[itemId] || 0) + 1;
    setCartItems(cartData);
    toast.success("Added to cart");
  };

  // ✅ Update cart item (Login protected)
  const updateCartItem = (itemId, quantity) => {
    if (!user) {
      toast.error("Please log in to update your cart");
      setShowUserLogin(true);
      return;
    }

    let cartData = structuredClone(cartItems);
    cartData[itemId] = quantity;
    setCartItems(cartData);
    toast.success("Cart updated");
  };

  // ✅ Remove from cart (Login protected)
  const removeFromCart = (itemId) => {
    if (!user) {
      toast.error("Please log in to remove items from cart");
      setShowUserLogin(true);
      return;
    }

    let cartData = structuredClone(cartItems);
    if (cartData[itemId]) {
      cartData[itemId] -= 1;
      if (cartData[itemId] === 0) {
        delete cartData[itemId];
      }
      setCartItems(cartData);
      toast.success("Removed from cart");
    }
  };

  // Cart count
  const getCartCount = () => {
    return Object.values(cartItems).reduce((a, b) => a + b, 0);
  };

  // Cart total
  const getCartAmount = () => {
    let total = 0;
    for (const id in cartItems) {
      const product = products.find((p) => p._id === id);
      if (product) {
        total += product.offerPrice * cartItems[id];
      }
    }
    return Math.floor(total * 100) / 100;
  };

  // Initial fetch — only call auth endpoints if we have a token
  useEffect(() => {
    if (getStored(TOKEN_KEY)) {
      fetchUser();
    } else {
      setAuthChecked(true);
    }
    if (getStored(SELLER_TOKEN_KEY)) fetchSeller();
    fetchProducts();
  }, []);

  // Sync cart to backend only when user is logged in AND the change came from a local mutation
  useEffect(() => {
    if (skipNextCartSync.current) {
      skipNextCartSync.current = false;
      return;
    }
    if (!user) return;

    const updateCart = async () => {
      try {
        const { data } = await axios.post("/api/cart/update", { cartItems });
        if (!data.success) {
          toast.error(data.message);
        }
      } catch (error) {
        console.error("Error updating cart:", error.message);
      }
    };

    updateCart();
  }, [cartItems, user]);

  const value = {
    navigate,
    user,
    setUser,
    isSeller,
    setIsSeller,
    showUserLogin,
    setShowUserLogin,
    products,
    setProducts,
    currency,
    cartItems,
    addToCart,
    updateCartItem,
    removeFromCart,
    searchQuery,
    setSearchQuery,
    getCartCount,
    getCartAmount,
    axios,
    fetchProducts,
    setCartItems,
    setUserToken,
    setSellerToken,
    authChecked,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
