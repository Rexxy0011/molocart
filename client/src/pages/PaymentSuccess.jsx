import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { backendUrl, token } = React.useContext(AppContext);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = new URLSearchParams(window.location.search).get(
        "reference"
      );

      if (!reference) {
        toast.error("Invalid payment reference");
        return navigate("/cart");
      }

      try {
        const { data } = await axios.post(
          backendUrl + "/api/order/verify-paystack",
          { reference },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (data.success) {
          toast.success("Payment successful!");
          navigate("/my-orders");
        } else {
          toast.error(data.message);
          navigate("/cart");
        }
      } catch (error) {
        toast.error(error.message);
        navigate("/cart");
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="p-10 text-center text-lg">
      Verifying payment, please wait...
    </div>
  );
};

export default PaymentSuccess;
