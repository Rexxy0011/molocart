import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

const MainBanner = () => {
  return (
    <div className="relative text-center md:text-left">
      {/* Desktop Banner */}
      <img
        src={assets.main_banner_bg}
        alt="banner"
        className="w-full hidden md:block"
      />
      {/* Mobile Banner */}
      <img
        src={assets.main_banner_bg_sm}
        alt="banner"
        className="w-full md:hidden"
      />

      {/* Banner Text + Buttons */}
      <div className="absolute inset-0 flex flex-col items-center md:items-start justify-end md:justify-center pb-20 md:pl-16 lg:pl-24">
        <h1 className="text-3xl md:text-5xl lg:text-4.5xl font-bold text-gray-900 text-center md:text-left max-w-xl leading-snug">
          Eat fresh and enjoy groceries delivered with care!
        </h1>

        <div className="flex items-center gap-4 mt-6 font-medium">
          {/* Shop Now Button */}
          <Link
            to="/products"
            className="group flex items-center gap-2 px-7 md:px-9 py-3 bg-primary hover:bg-primary-dull transition rounded text-white cursor-pointer"
          >
            Shop now
            <img
              className="md:hidden transition group-hover:translate-x-1"
              src={assets.white_arrow_icon}
              alt="arrow"
            />
          </Link>

          {/* Explore Deals Button (no border now) */}
          <Link
            to="/products"
            className="group hidden md:flex items-center gap-2 px-7 py-3 text-gray-700 hover:text-black cursor-pointer"
          >
            Explore deals
            <img
              className="transition group-hover:translate-x-1"
              src={assets.black_arrow_icon}
              alt="arrow"
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainBanner;
