import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../../contexts/CartContext";
import { toast } from "../../hooks/useNotification";
import api from "../../services/api";

const AllProducts = () => {
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchProducts(1);
  }, [selectedCategory, selectedRestaurant, searchTerm]);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  const fetchData = async () => {
    try {
      const [categoriesRes, restaurantsRes] = await Promise.all([
        api.get("/categories/"),
        api.get("/restaurants/"),
      ]);
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setRestaurants(restaurantsRes.data.results || restaurantsRes.data);
      await fetchProducts(1);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("ERROR_LOADING_DATA");
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      let url = "/products/";
      const params = new URLSearchParams();

      params.append("page", page);
      params.append("page_size", "12"); // Show 12 products per page
      params.append("limit", "12"); // Alternative parameter name for some APIs

      if (selectedCategory) {
        params.append("category_id", selectedCategory);
      }

      if (selectedRestaurant) {
        params.append("restaurant_id", selectedRestaurant);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      url += "?" + params.toString();

      const response = await api.get(url);
      const data = response.data;

      // Handle pagination data - ensure maximum 12 products per page
      if (data.results) {
        // API with pagination support
        const limitedProducts = data.results.slice(0, 12);
        setProducts(limitedProducts);
        setTotalProducts(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / 12));
      } else {
        // API without pagination - implement client-side pagination
        const allProducts = data || [];
        const startIndex = (page - 1) * 12;
        const endIndex = startIndex + 12;
        const limitedProducts = allProducts.slice(startIndex, endIndex);
        setProducts(limitedProducts);
        setTotalProducts(allProducts.length || 0);
        setTotalPages(Math.ceil((allProducts.length || 0) / 12));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("ERROR_LOADING_PRODUCTS");
    } finally {
      setLoading(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">
            {error === "ERROR_LOADING_DATA"
              ? "Failed to load data"
              : error === "ERROR_LOADING_PRODUCTS"
              ? "Failed to load products"
              : error}
          </p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="mt-4 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">
          All Products
        </h1>
        <p className="text-secondary-600">
          Choose your favorite food from different restaurants ({totalProducts}{" "}
          items)
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Search for products
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products"
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Restaurant
            </label>
            <select
              value={selectedRestaurant}
              onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="w-full p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All restaurants</option>
              {restaurants.map((restaurant) => (
                <option
                  key={restaurant.restaurant_id}
                  value={restaurant.restaurant_id}
                >
                  {restaurant.restaurant_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedCategory || selectedRestaurant || searchTerm) && (
          <button
            onClick={() => {
              setSelectedCategory("");
              setSelectedRestaurant("");
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.product_id}
                className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  restaurants.find(
                    (r) =>
                      (r.restaurant_id === product.restaurant_id ||
                        r.restaurant_id === product.restaurant?.restaurant_id ||
                        r.restaurant_id === product.restaurant?.id ||
                        r.restaurant_id === product.restaurant) &&
                      r.status === "closed"
                  )
                    ? "opacity-75"
                    : ""
                }`}
              >
                <div className="relative h-48 bg-gray-200">
                  {product.image_display_url || product.image ? (
                    <img
                      src={product.image_display_url || product.image}
                      alt={product.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={
                      "w-full h-full flex items-center justify-center " +
                      (product.image_display_url || product.image
                        ? "hidden"
                        : "")
                    }
                  >
                    <div className="text-6xl opacity-30">🍽️</div>
                  </div>

                  {/* ตรวจสอบสถานะร้านก่อน แล้วค่อยแสดงสถานะสินค้า */}
                  {(() => {
                    const restaurant = restaurants.find(
                      (r) =>
                        r.restaurant_id === product.restaurant_id ||
                        r.restaurant_id === product.restaurant?.restaurant_id ||
                        r.restaurant_id === product.restaurant?.id ||
                        r.restaurant_id === product.restaurant
                    );

                    if (restaurant?.status === "closed") {
                      return (
                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-white font-semibold text-lg block">
                              Closed
                            </span>
                            <span className="text-white/80 text-sm">
                              {restaurant.restaurant_name}
                            </span>
                          </div>
                        </div>
                      );
                    } else if (!product.is_available) {
                      return (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            Not available
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-secondary-800 mb-2">
                    {product.product_name}
                  </h3>

                  <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                    {product.description || "No description"}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-primary-500 font-bold text-lg">
                      {Number(product.price || 0).toFixed(2)}
                    </span>
                    <span className="text-xs text-secondary-500">
                      {product.restaurant_name ||
                        product.restaurant?.restaurant_name ||
                        product.restaurant?.name ||
                        "Restaurant"}
                    </span>
                  </div>

                  {product.category && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-secondary-100 text-secondary-700 text-xs rounded-full">
                        {product.category.category_name}
                      </span>
                    </div>
                  )}

                  {(() => {
                    const restaurant = restaurants.find(
                      (r) =>
                        r.restaurant_id === product.restaurant_id ||
                        r.restaurant_id === product.restaurant?.restaurant_id ||
                        r.restaurant_id === product.restaurant?.id ||
                        r.restaurant_id === product.restaurant
                    );

                    const isRestaurantClosed = restaurant?.status === "closed";
                    const isProductUnavailable = !product.is_available;

                    return (
                      <>
                        {/* แสดงสถานะ */}
                        {(isRestaurantClosed || isProductUnavailable) && (
                          <div className="mb-2">
                            <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 block text-center">
                              {isRestaurantClosed ? "Closed" : "Not available"}
                            </span>
                          </div>
                        )}

                        {/* ปุ่มดูร้านนี้ */}
                        <Link
                          to={`/restaurants/${
                            product.restaurant_id ||
                            product.restaurant?.restaurant_id ||
                            product.restaurant?.id ||
                            product.restaurant
                          }`}
                          className="block w-full mb-2 py-2 px-4 bg-secondary-100 text-secondary-700 text-center rounded-lg font-medium hover:bg-secondary-200 transition-colors text-sm"
                        >
                          🏪 View this restaurant
                        </Link>

                        {/* ปุ่มเพิ่มลงตะกร้า - แสดงเฉพาะเมื่อร้านเปิดและสินค้าพร้อมจำหน่าย */}
                        {!isRestaurantClosed && !isProductUnavailable && (
                          <button
                            onClick={() => {
                              const restaurantData = {
                                id: restaurant.restaurant_id,
                                name: restaurant.restaurant_name,
                                address: restaurant.address,
                                phone_number: restaurant.phone_number,
                                status: restaurant.status,
                              };

                              const productData = {
                                ...product,
                                restaurant_status: restaurant.status,
                              };

                              const result = addItem(
                                productData,
                                restaurantData
                              );

                              if (result && result.success === false) {
                                // หากต้องการ login ให้ CartContext จัดการ redirect ไปเอง
                                if (result.requiresLogin) {
                                  return; // ไม่แสดง alert เพิ่มเติม
                                }

                                toast.error(
                                  result.error ||
                                    "Error occurred while adding product"
                                );
                                return;
                              }

                              // แสดงข้อความยืนยัน
                              toast.success(
                                `Added "${product.product_name}" to cart!`
                              );
                            }}
                            className="w-full py-2 px-4 rounded-lg font-semibold transition-colors bg-primary-500 text-white hover:bg-primary-600"
                          >
                            Add to cart
                          </button>
                        )}

                        {/* ปุ่มปิดใช้งานสำหรับร้านปิดหรือสินค้าไม่พร้อม */}
                        {(isRestaurantClosed || isProductUnavailable) && (
                          <button
                            disabled
                            className="w-full py-2 px-4 rounded-lg font-semibold bg-gray-300 text-gray-500 cursor-not-allowed"
                          >
                            {isRestaurantClosed ? "Closed" : "Not available"}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                {/* Previous Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === 1
                      ? "bg-secondary-200 text-secondary-400 cursor-not-allowed"
                      : "bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50"
                  }`}
                >
                  Previous
                </button>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + index;
                  } else {
                    pageNumber = currentPage - 2 + index;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === pageNumber
                          ? "bg-primary-500 text-white"
                          : "bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === totalPages
                      ? "bg-secondary-200 text-secondary-400 cursor-not-allowed"
                      : "bg-white border border-secondary-300 text-secondary-700 hover:bg-secondary-50"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-30">🍽️</div>
          <h3 className="text-xl font-semibold text-secondary-700 mb-2">
            No products found
          </h3>
          <p className="text-secondary-500 mb-6">
            Try changing the search or filter
          </p>
          <button
            onClick={() => {
              setSelectedCategory("");
              setSelectedRestaurant("");
              setSearchTerm("");
              setCurrentPage(1);
            }}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AllProducts;
