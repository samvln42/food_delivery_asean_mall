import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../contexts/CartContext";
import { useGuestCart } from "../../contexts/GuestCartContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  HomeIcon,
  BuildingStorefrontIcon,
  Squares2X2Icon,
  ShoppingBagIcon,
  UserIcon,
  ShoppingCartIcon,
  ArrowRightOnRectangleIcon,
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const BottomNavigation = () => {
  const { user, isAuthenticated } = useAuth();
  const { itemCount: cartItemCount } = useCart();
  const { itemCount: guestCartItemCount } = useGuestCart();
  const { translate } = useLanguage();
  const location = useLocation();

  // เลือก itemCount ตามสถานะการล็อกอิน
  const getItemCount = () => {
    if (isAuthenticated) {
      return cartItemCount;
    } else {
      return guestCartItemCount;
    }
  };

  const itemCount = getItemCount();

  const getCustomerNavItems = () => [
    {
      name: translate("common.home"),
      href: "/",
      icon: HomeIcon,
      current: location.pathname === "/",
    },
    {
      name: translate("nav.categories"),
      href: "/categories",
      icon: Squares2X2Icon,
      current: location.pathname === "/categories",
    },
    {
      name: translate("nav.all_products"),
      href: "/products",
      icon: ShoppingBagIcon,
      current: location.pathname === "/products",
    },
    {
      name: translate("cart.cart"),
      href: "/cart",
      icon: ShoppingCartIcon,
      current: location.pathname === "/cart",
      showBadge: true,
    },
  ];

  const getRestaurantNavItems = () => [
    {
      name: translate("common.home"),
      href: "/",
      icon: HomeIcon,
      current: location.pathname === "/",
    },
    {
      name: translate("restaurant.menu"),
      href: "/restaurant/products",
      icon: ShoppingBagIcon,
      current: location.pathname === "/restaurant/products",
    },
    {
      name: translate("restaurant.orders"),
      href: "/restaurant/orders",
      icon: ShoppingCartIcon,
      current: location.pathname === "/restaurant/orders",
    },
  ];

  const getGuestNavItems = () => [
    {
      name: translate("common.home"),
      href: "/",
      icon: HomeIcon,
      current: location.pathname === "/",
    },
    {
      name: translate("nav.categories"),
      href: "/categories",
      icon: Squares2X2Icon,
      current: location.pathname === "/categories",
    },
    {
      name: translate("nav.all_products"),
      href: "/products",
      icon: ShoppingBagIcon,
      current: location.pathname === "/products",
    },
    {
      name: translate("cart.cart"),
      href: "/guest-cart",
      icon: ShoppingCartIcon,
      current: location.pathname === "/guest-cart",
      showBadge: true,
    },
    // {
    //   name: "Orders",
    //   href: "/guest-orders",
    //   icon: UserIcon,
    //   current: location.pathname === "/guest-orders",
    // },
  ];

  const getNavItems = () => {
    if (!isAuthenticated) {
      return getGuestNavItems();
    }

    if (user?.role === "customer") {
      return getCustomerNavItems();
    }

    if (
      user?.role === "special_restaurant" ||
      user?.role === "general_restaurant"
    ) {
      return getRestaurantNavItems();
    }

    return getGuestNavItems();
  };

  const navItems = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-secondary-200 md:hidden">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center py-2 px-3 min-w-0 flex-1 ${
                item.current
                  ? "text-primary-600"
                  : "text-secondary-500 hover:text-secondary-700"
              }`}
            >
              <div className="relative">
                <Icon className="h-6 w-6 mb-1" />
                {item.showBadge && itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
