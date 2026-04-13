import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { axios, setCartItems } = useAppContext();

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
        const { data } = await axios.post("/api/order/verify-korapay", {
          reference,
        });

        if (data.success) {
          toast.success("Payment successful!");
          setCartItems({});
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
