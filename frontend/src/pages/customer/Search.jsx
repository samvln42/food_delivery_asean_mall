import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../services/api";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { translate } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState("all");
  const [results, setResults] = useState({
    restaurants: [],
    products: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query) => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const searchPromises = [];

      if (searchType === "all" || searchType === "restaurants") {
        searchPromises.push(
          api
            .get(`/restaurants/?search=${encodeURIComponent(query)}`)
            .then((response) => ({
              type: "restaurants",
              data: response.data.results || response.data,
            }))
            .catch(() => ({ type: "restaurants", data: [] }))
        );
      }

      if (searchType === "all" || searchType === "products") {
        searchPromises.push(
          api
            .get(`/products/?search=${encodeURIComponent(query)}`)
            .then((response) => ({
              type: "products",
              data: response.data.results || response.data,
            }))
            .catch(() => ({ type: "products", data: [] }))
        );
      }

      const searchResults = await Promise.all(searchPromises);

      const newResults = { restaurants: [], products: [] };
      searchResults.forEach((result) => {
        newResults[result.type] = result.data;
      });

      setResults(newResults);
    } catch (error) {
      console.error("Search error:", error);
      setError(translate("common.error_searching"));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      performSearch(searchQuery);
    }
  };

  const handleAddToCart = (product) => {
    console.log("Adding product to cart from search:", product);

    // การตรวจสอบ login จะทำใน CartContext แล้ว
    // ไม่ต้องตรวจสอบที่นี่อีก

    if (!product.is_available) {
      alert(translate("common.out_of_stock"));
      return;
    }

    try {
      // สร้าง restaurant object จากข้อมูลสินค้า
      const restaurant = {
        id: product.restaurant_id,
        name: product.restaurant_name,
      };

      // เพิ่มสินค้าลงตะกร้า
      const result = addItem(product, restaurant);

      // ตรวจสอบผลลัพธ์
      if (result && result.success === false) {
        // หากต้องการ login ให้ CartContext จัดการ redirect ไปเอง
        if (result.requiresLogin) {
          return; // ไม่แสดง alert เพิ่มเติม
        }

        alert(result.error || translate("common.error_adding_to_cart"));
        return;
      }

      // แสดงข้อความยืนยัน
      alert(
        translate("common.added_to_cart", { product: product.product_name })
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert(translate("common.error_adding_to_cart"));
    }
  };

  const totalResults = results.restaurants.length + results.products.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Form */}
      <div className="max-w-2xl mx-auto mb-8">
        <form
          onSubmit={handleSearch}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {translate("search.search_for_restaurant_or_menu")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={translate("search.enter_search_term")}
                  className="flex-1 p-3 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {translate("search.search")}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {translate("search.search_type")}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="all"
                    checked={searchType === "all"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="mr-2"
                  />
                  {translate("common.all")}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="restaurants"
                    checked={searchType === "restaurants"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="mr-2"
                  />
                  {translate("common.restaurant")}
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="products"
                    checked={searchType === "products"}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="mr-2"
                  />
                  {translate("search.menu")}
                </label>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">
            {translate("search.searching")}
          </p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {!loading && !error && searchParams.get("q") && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-secondary-800">
              {translate("search.search_results", {
                query: searchParams.get("q"),
                count: totalResults,
              })}
            </h2>
          </div>

          {/* Restaurants Results */}
          {results.restaurants.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-secondary-700 mb-4">
                {translate("search.restaurants_results", {
                  count: results.restaurants.length,
                })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.restaurants.map((restaurant) => (
                  <Link
                    key={restaurant.restaurant_id}
                    to={`/restaurants/${restaurant.restaurant_id}`}
                    className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {restaurant.image ? (
                        <img
                          src={restaurant.image}
                          alt={restaurant.restaurant_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-6xl opacity-30">🏪</div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-lg text-secondary-800 mb-2 group-hover:text-primary-600">
                        {restaurant.restaurant_name}
                      </h4>
                      <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                        {restaurant.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-yellow-500">⭐</span>
                          <span className="ml-1 font-semibold">
                            {Number(restaurant.average_rating || 0).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-primary-500 font-semibold group-hover:text-primary-600">
                          {translate("search.view_menu")}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Products Results */}
          {results.products.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-secondary-700 mb-4">
                {translate("search.menu_results", {
                  count: results.products.length,
                })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {results.products.map((product) => (
                  <div
                    key={product.product_id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-4xl opacity-30">🍽️</div>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-secondary-800 mb-2">
                        {product.product_name}
                      </h4>
                      <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-primary-500 font-bold text-lg">
                          ฿{Number(product.price).toFixed(2)}
                        </span>
                        <span className="text-xs text-secondary-500">
                          {product.restaurant_name}
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                          product.is_available === false
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : isAuthenticated
                            ? "bg-primary-500 text-white hover:bg-primary-600"
                            : "bg-secondary-300 text-secondary-500"
                        }`}
                        disabled={product.is_available === false}
                      >
                        {product.is_available === false
                          ? translate("common.out_of_stock")
                          : !isAuthenticated
                          ? translate("common.login_to_order")
                          : translate("cart.add")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {totalResults === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-30">🔍</div>
              <h3 className="text-xl font-semibold text-secondary-700 mb-2">
                {translate("search.no_search_results")}
              </h3>
              <p className="text-secondary-500 mb-6">
                {translate("search.try_different_search_or_change_type")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!searchParams.get("q") && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4 opacity-30">🔍</div>
          <h3 className="text-xl font-semibold text-secondary-700 mb-2">
            {translate("search.search_for_restaurant_or_menu")}
          </h3>
          <p className="text-secondary-500">
            {translate("search.enter_search_above_to_start")}
          </p>
        </div>
      )}
    </div>
  );
};

export default Search;
