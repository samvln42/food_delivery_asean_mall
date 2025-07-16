import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { GuestCartProvider } from './contexts/GuestCartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Header from './components/common/Header';
import ErrorBoundary from './components/common/ErrorBoundary';
import AdminNotificationBridge from './components/admin/AdminNotificationBridge';


// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

// Customer Pages
import Home from './pages/customer/Home';
import Categories from './pages/customer/Categories';
import CategoryDetail from './pages/customer/CategoryDetail';
import Restaurants from './pages/customer/Restaurants';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import AllProducts from './pages/customer/AllProducts';
import Search from './pages/customer/Search';
import Profile from './pages/customer/Profile';
import Notifications from './pages/customer/Notifications';
import Cart from './pages/customer/Cart';
import GuestCart from './pages/customer/GuestCart';

import GuestOrders from './pages/customer/GuestOrders';

import Orders from './pages/customer/Orders';

import Settings from './pages/customer/Settings';
import Contact from './pages/customer/Contact';
import About from './pages/customer/About';
import RestaurantOrders from './pages/restaurant/RestaurantOrders';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminGuestOrders from './pages/admin/AdminGuestOrders';
import AdminRestaurants from './pages/admin/AdminRestaurants';
import AdminCategories from './pages/admin/AdminCategories';
import AdminRestaurantProducts from './pages/admin/AdminRestaurantProducts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminNotifications from './pages/admin/AdminNotifications';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import RestaurantLayout from './layouts/RestaurantLayout';
import AdminLayout from './layouts/AdminLayout';

// Error Pages
import NotFound from './pages/errors/NotFound';
import Unauthorized from './pages/errors/Unauthorized';

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <GuestCartProvider>
              <Router>
                <div className="min-h-screen bg-secondary-50">
                  <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/login" element={
                      <ProtectedRoute requireAuth={false}>
                        <Login />
                      </ProtectedRoute>
                    } />
                    <Route path="/register" element={
                      <ProtectedRoute requireAuth={false}>
                        <Register />
                      </ProtectedRoute>
                    } />
                    <Route path="/verify-email" element={
                      <ProtectedRoute requireAuth={false}>
                        <VerifyEmail />
                      </ProtectedRoute>
                    } />

                    {/* Guest Order Routes (No Login Required) */}
                    <Route path="/guest-cart" element={
                      <CustomerLayout>
                        <GuestCart />
                      </CustomerLayout>
                    } />

                    <Route path="/guest-orders" element={
                      <CustomerLayout>
                        <GuestOrders />
                      </CustomerLayout>
                    } />



                    {/* Customer Routes */}
                    <Route path="/" element={
                      <CustomerLayout>
                        <Home />
                      </CustomerLayout>
                    } />
                    
                    <Route path="/restaurants" element={
                      <CustomerLayout>
                        <Restaurants />
                      </CustomerLayout>
                    } />

                    <Route path="/restaurants/:id" element={
                      <CustomerLayout>
                        <RestaurantDetail />
                      </CustomerLayout>
                    } />

                    <Route path="/categories" element={
                      <CustomerLayout>
                        <Categories />
                      </CustomerLayout>
                    } />

                    <Route path="/categories/:id" element={
                      <CustomerLayout>
                        <CategoryDetail />
                      </CustomerLayout>
                    } />

                    <Route path="/products" element={
                      <CustomerLayout>
                        <AllProducts />
                      </CustomerLayout>
                    } />

                    <Route path="/search" element={
                      <CustomerLayout>
                        <Search />
                      </CustomerLayout>
                    } />

                    {/* Public Pages */}
                    <Route path="/about" element={
                      <CustomerLayout>
                        <About />
                      </CustomerLayout>
                    } />

                    <Route path="/contact" element={
                      <CustomerLayout>
                        <Contact />
                      </CustomerLayout>
                    } />

                    <Route path="/help" element={
                      <CustomerLayout>
                        <div className="container mx-auto px-4 py-8">
                          <div className="max-w-4xl mx-auto">
                            <h1 className="text-3xl font-bold text-secondary-800 mb-6">Help Center</h1>
                            <div className="bg-white rounded-lg shadow-md p-8">
                              <h2 className="text-2xl font-semibold text-secondary-700 mb-6">Frequently Asked Questions (FAQ)</h2>
                              <div className="space-y-6">
                                <div className="border-b border-secondary-200 pb-4">
                                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">🍕 How to order food</h3>
                                  <p className="text-secondary-600">
                                    1. Select a restaurant<br/>
                                    2. Select a menu and add to cart<br/>
                                    3. Check the list and fill in the delivery address<br/>
                                    4. Select a payment method and confirm the order
                                  </p>
                                </div>
                                <div className="border-b border-secondary-200 pb-4">
                                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">💳 How to pay</h3>
                                  <p className="text-secondary-600">
                                    We accept payment via credit card, debit card, bank transfer, and cash on delivery (for some areas)
                                  </p>
                                </div>
                                <div className="border-b border-secondary-200 pb-4">
                                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">🚚 Delivery time</h3>
                                  <p className="text-secondary-600">
                                    Normally it takes 30-45 minutes, depending on the distance and the complexity of the order
                                  </p>
                                </div>
                                <div className="border-b border-secondary-200 pb-4">
                                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">📦 How to track the order</h3>
                                  <p className="text-secondary-600">
                                    You can track the order status in the "Order History" page or via email and SMS
                                  </p>
                                </div>
                                <div className="border-b border-secondary-200 pb-4">
                                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">🔄 How to cancel the order</h3>
                                  <p className="text-secondary-600">
                                    You can cancel the order within 5 minutes after placing the order. If you exceed this time, please contact the customer service
                                  </p>
                                </div>
                                <div className="border-b border-secondary-200 pb-4">
                                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">💰 Delivery fee</h3>
                                  <p className="text-secondary-600">
                                    The delivery fee is 15 baht and may vary depending on the distance. For orders over 200 baht, delivery is free
                                  </p>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-secondary-700 mb-2">🆘 Contact us</h3>
                                  <p className="text-secondary-600">
                                    If you don't find the answer you're looking for, please contact us at:<br/>
                                    Phone: 02-xxx-xxxx | Email: support@fooddelivery.com
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CustomerLayout>
                    } />

                    <Route path="/terms" element={
                      <CustomerLayout>
                        <div className="container mx-auto px-4 py-8">
                          <div className="max-w-4xl mx-auto">
                            <h1 className="text-3xl font-bold text-secondary-800 mb-6">Terms of Service</h1>
                            <div className="bg-white rounded-lg shadow-md p-8">
                              <div className="space-y-6">
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">1. Acceptance of Terms</h2>
                                  <p className="text-secondary-600">
                                    By using our service, you agree to comply with all terms and conditions outlined here
                                  </p>
                                </div>
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">2. Account Creation</h2>
                                  <p className="text-secondary-600">
                                    • You must be at least 18 years old or have parental consent<br/>
                                    • The information provided must be accurate and up-to-date<br/>
                                    • You are responsible for maintaining the security of your password
                                  </p>
                                </div>
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">3. Ordering and Payment</h2>
                                  <p className="text-secondary-600">
                                    • The price shown includes tax<br/>
                                    • Payment must be made through the channels we have set up<br/>
                                    • You can cancel the order within 5 minutes after placing the order
                                  </p>
                                </div>
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">4. Delivery</h2>
                                  <p className="text-secondary-600">
                                    • We try to deliver on time, but there may be delays<br/>
                                    • The recipient must be at least 18 years old or have parental consent<br/>
                                    • If there is no one to receive, we will contact you within 15 minutes
                                  </p>
                                </div>
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">5. Refund and Guarantee</h2>
                                  <p className="text-secondary-600">
                                    • If the food has quality issues, we will refund or replace it<br/>
                                    • You must report the problem within 1 hour after receiving the food<br/>
                                    • Refunds will be processed within 7-14 business days
                                  </p>
                                </div>
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">6. Limitation of Liability</h2>
                                  <p className="text-secondary-600">
                                    We are not responsible for any damage caused by the use of our service, except in cases of our negligence
                                  </p>
                                </div>
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">7. Modification of Terms</h2>
                                  <p className="text-secondary-600">
                                    We reserve the right to modify these terms at any time, with advance notice of 30 days
                                  </p>
                                </div>
                                <div className="bg-secondary-50 p-4 rounded-lg">
                                  <p className="text-sm text-secondary-600">
                                    <strong>Effective date:</strong> January 1, 2024<br/>
                                    <strong>Contact us:</strong> legal@fooddelivery.com | 02-xxx-xxxx
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CustomerLayout>
                    } />

                    <Route path="/privacy" element={
                      <CustomerLayout>
                        <div className="container mx-auto px-4 py-8">
                          <div className="max-w-4xl mx-auto">
                            <h1 className="text-3xl font-bold text-secondary-800 mb-6">Privacy Policy</h1>
                            <div className="bg-white rounded-lg shadow-md p-8">
                              <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                  <p className="text-blue-800">
                                    <strong>We value your privacy</strong> This policy explains how we collect, use, and protect your personal information
                                  </p>
                                </div>
                                
                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">1. Information we collect</h2>
                                  <p className="text-secondary-600 mb-2">We collect the following information:</p>
                                  <ul className="list-disc list-inside text-secondary-600 space-y-1">
                                    <li>Personal information: Name, email, phone number</li>
                                    <li>Delivery address: Delivery address, GPS coordinates</li>
                                    <li>Order history: Order history, payment information</li>
                                    <li>Usage information: Website visits, clicks</li>
                                  </ul>
                                </div>

                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">2. Purpose of use</h2>
                                  <ul className="list-disc list-inside text-secondary-600 space-y-1">
                                    <li>Process and deliver orders</li>
                                    <li>Contact and inform</li>
                                    <li>Improve service and user experience</li>
                                    <li>Analyze user behavior to improve service</li>
                                    <li>Prevent fraud and protect our rights</li>
                                  </ul>
                                </div>

                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">3. Sharing information</h2>
                                  <p className="text-secondary-600 mb-2">We will only share information in the following cases:</p>
                                  <ul className="list-disc list-inside text-secondary-600 space-y-1">
                                    <li>With restaurants and delivery staff to process and deliver orders</li>
                                    <li>With payment service providers to process payments</li>
                                    <li>When ordered by a court or government agency</li>
                                    <li>To protect our rights and safety</li>
                                  </ul>
                                </div>

                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">4. Data security</h2>
                                  <p className="text-secondary-600">
                                    We use appropriate security measures such as encryption, access control, and regular system checks to prevent unauthorized access, use, or disclosure of information
                                  </p>
                                </div>

                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">5. Your rights</h2>
                                  <p className="text-secondary-600 mb-2">You have the right to:</p>
                                  <ul className="list-disc list-inside text-secondary-600 space-y-1">
                                    <li>Access and request copies of your personal data</li>
                                    <li>Correct or complete inaccurate or incomplete data</li>
                                    <li>Delete personal data (except in cases where the law requires)</li>
                                    <li>Object to processing of your data</li>
                                    <li>Withdraw consent at any time</li>
                                  </ul>
                                </div>

                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">6. Cookies</h2>
                                  <p className="text-secondary-600">
                                    We use cookies to improve your experience, analyze usage, and show relevant ads. You can manage cookies in your browser settings
                                  </p>
                                </div>

                                <div>
                                  <h2 className="text-xl font-semibold text-secondary-700 mb-3">7. Contact us</h2>
                                  <p className="text-secondary-600">
                                    If you have questions about this privacy policy or want to exercise your rights, please contact us at privacy@fooddelivery.com or 02-xxx-xxxx
                                  </p>
                                </div>

                                <div className="bg-secondary-50 p-4 rounded-lg">
                                  <p className="text-sm text-secondary-600">
                                    <strong>Effective date:</strong> January 1, 2024<br/>
                                    <strong>Contact us:</strong> legal@fooddelivery.com | 02-xxx-xxxx
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CustomerLayout>
                    } />

                    {/* Customer Protected Routes */}
                    <Route path="/cart" element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerLayout>
                          <Cart />
                        </CustomerLayout>
                      </ProtectedRoute>
                    } />


                    <Route path="/orders" element={
                      <ProtectedRoute allowedRoles={['customer', 'general_restaurant', 'special_restaurant', 'admin']}>
                        <CustomerLayout>
                          <Orders />
                        </CustomerLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                      <ProtectedRoute allowedRoles={['customer', 'general_restaurant', 'special_restaurant', 'admin']}>
                        <CustomerLayout>
                          <Profile />
                        </CustomerLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/notifications" element={
                      <ProtectedRoute allowedRoles={['customer', 'general_restaurant', 'special_restaurant', 'admin']}>
                        <CustomerLayout>
                          <Notifications />
                        </CustomerLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/settings" element={
                      <ProtectedRoute allowedRoles={['customer', 'general_restaurant', 'special_restaurant', 'admin']}>
                        <CustomerLayout>
                          <Settings />
                        </CustomerLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/favorites" element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerLayout>
                          <div className="container mx-auto px-4 py-8">
                            <h1 className="text-3xl font-bold text-secondary-800 mb-6">Favorite list</h1>
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                              <div className="text-6xl mb-4 opacity-30">❤️</div>
                              <h2 className="text-xl font-semibold text-secondary-700 mb-2">No favorite list</h2>
                              <p className="text-secondary-500 mb-6">Add your favorite restaurant or menu to the favorite list</p>
                              <Link to="/restaurants" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors inline-block">
                                Search for restaurant
                              </Link>
                            </div>
                          </div>
                        </CustomerLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/addresses" element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <CustomerLayout>
                          <div className="container mx-auto px-4 py-8">
                            <h1 className="text-3xl font-bold text-secondary-800 mb-6">My address</h1>
                            <div className="bg-white rounded-lg shadow-md p-8">
                              <div className="text-center mb-8">
                                <div className="text-6xl mb-4 opacity-30">📍</div>
                                <h2 className="text-xl font-semibold text-secondary-700 mb-2">No address</h2>
                                <p className="text-secondary-500 mb-6">Add your address for convenient delivery</p>
                                <button className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors">
                                  Add new address
                                </button>
                              </div>
                              <div className="border-t pt-6">
                                <p className="text-sm text-secondary-500 text-center">
                                  Feature to manage address is under development
                                </p>
                              </div>
                            </div>
                          </div>
                        </CustomerLayout>
                      </ProtectedRoute>
                    } />

                    {/* Restaurant Routes */}
                    <Route path="/restaurant" element={
                      <ProtectedRoute allowedRoles={['general_restaurant', 'special_restaurant']}>
                        <RestaurantLayout>
                          <div className="container mx-auto px-4 py-8">
                            <h1 className="text-3xl font-bold text-secondary-800 mb-6">Restaurant dashboard</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                              <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                  <div className="text-3xl text-blue-500 mr-4">📋</div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-secondary-700">Today's order</h3>
                                    <p className="text-2xl font-bold text-secondary-800">0</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                  <div className="text-3xl text-green-500 mr-4">💰</div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-secondary-700">Today's sales</h3>
                                    <p className="text-2xl font-bold text-secondary-800">0</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                  <div className="text-3xl text-yellow-500 mr-4">🍽️</div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-secondary-700">Total menu</h3>
                                    <p className="text-2xl font-bold text-secondary-800">0</p>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center">
                                  <div className="text-3xl text-orange-500 mr-4">⭐</div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-secondary-700">Average rating</h3>
                                    <p className="text-2xl font-bold text-secondary-800">0.0</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-md p-8 text-center">
                              <div className="text-6xl mb-4 opacity-30">🚀</div>
                              <h2 className="text-xl font-semibold text-secondary-700 mb-2">Start managing your restaurant</h2>
                              <p className="text-secondary-500 mb-6">Add menu, manage orders, and track sales</p>
                              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link to="/restaurant/menu" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors">
                                  Manage menu
                                </Link>
                                <Link to="/restaurant/orders" className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-300 transition-colors">
                                  View orders
                                </Link>
                              </div>
                            </div>
                          </div>
                        </RestaurantLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/restaurant/orders" element={
                      <ProtectedRoute allowedRoles={['general_restaurant', 'special_restaurant']}>
                        <RestaurantLayout>
                          <RestaurantOrders />
                        </RestaurantLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/restaurant/menu" element={
                      <ProtectedRoute allowedRoles={['general_restaurant', 'special_restaurant']}>
                        <RestaurantLayout>
                          <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold">Manage menu</h1>
                            <p className="text-secondary-600 mt-2">Under development...</p>
                          </div>
                        </RestaurantLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/restaurant/reviews" element={
                      <ProtectedRoute allowedRoles={['general_restaurant', 'special_restaurant']}>
                        <RestaurantLayout>
                          <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold">Restaurant reviews</h1>
                            <p className="text-secondary-600 mt-2">Under development...</p>
                          </div>
                        </RestaurantLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/restaurant/analytics" element={
                      <ProtectedRoute allowedRoles={['general_restaurant', 'special_restaurant']}>
                        <RestaurantLayout>
                          <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold">Restaurant analytics</h1>
                            <p className="text-secondary-600 mt-2">Under development...</p>
                          </div>
                        </RestaurantLayout>
                      </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
                    <Route path="/admin" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminDashboard />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/users" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminUsers />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/restaurants" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminRestaurants />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/restaurants/:restaurantId/products" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminRestaurantProducts />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/categories" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminCategories />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/orders" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminOrders />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/guest-orders" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminGuestOrders />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/analytics" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <div className="p-8 text-center">
                            <h1 className="text-2xl font-bold">Reports and statistics</h1>
                            <p className="text-secondary-600 mt-2">Under development...</p>
                          </div>
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/settings" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminSettings />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/notifications" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout>
                          <AdminNotifications />
                        </AdminLayout>
                      </ProtectedRoute>
                    } />

                    {/* Error Routes */}
                    <Route path="/unauthorized" element={<Unauthorized />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </Router>
            </GuestCartProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
