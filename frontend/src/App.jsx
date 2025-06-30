import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './utils/ProtectedRoute';
import Header from './components/common/Header';
import ErrorBoundary from './components/common/ErrorBoundary';


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
import Orders from './pages/customer/Orders';
import Settings from './pages/customer/Settings';
import Contact from './pages/customer/Contact';
import About from './pages/customer/About';
import RestaurantOrders from './pages/restaurant/RestaurantOrders';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
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
      <AuthProvider>
        <CartProvider>
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
                    <h1 className="text-3xl font-bold text-secondary-800 mb-6">ศูนย์ช่วยเหลือ</h1>
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <h2 className="text-2xl font-semibold text-secondary-700 mb-6">คำถามที่พบบ่อย (FAQ)</h2>
                      <div className="space-y-6">
                        <div className="border-b border-secondary-200 pb-4">
                          <h3 className="text-lg font-semibold text-secondary-700 mb-2">🍕 วิธีการสั่งอาหาร</h3>
                          <p className="text-secondary-600">
                            1. เลือกร้านอาหารที่ต้องการ<br/>
                            2. เลือกเมนูและเพิ่มลงตะกร้า<br/>
                            3. ตรวจสอบรายการและกรอกที่อยู่จัดส่ง<br/>
                            4. เลือกวิธีการชำระเงินและยืนยันการสั่งซื้อ
                          </p>
                        </div>
                        <div className="border-b border-secondary-200 pb-4">
                          <h3 className="text-lg font-semibold text-secondary-700 mb-2">💳 วิธีการชำระเงิน</h3>
                          <p className="text-secondary-600">
                            เรารับชำระเงินผ่านบัตรเครดิต, บัตรเดบิต, โอนผ่านธนาคาร และเงินสดปลายทาง (สำหรับบางพื้นที่)
                          </p>
                        </div>
                        <div className="border-b border-secondary-200 pb-4">
                          <h3 className="text-lg font-semibold text-secondary-700 mb-2">🚚 เวลาจัดส่ง</h3>
                          <p className="text-secondary-600">
                            โดยปกติใช้เวลาจัดส่ง 30-45 นาที ขึ้นอยู่กับระยะทางและความคึกคักของการสั่งซื้อ
                          </p>
                        </div>
                        <div className="border-b border-secondary-200 pb-4">
                          <h3 className="text-lg font-semibold text-secondary-700 mb-2">📦 การติดตามสถานะ</h3>
                          <p className="text-secondary-600">
                            คุณสามารถติดตามสถานะการสั่งซื้อได้ในหน้า "ประวัติการสั่งซื้อ" หรือผ่านอีเมลและ SMS ที่ส่งให้
                          </p>
                        </div>
                        <div className="border-b border-secondary-200 pb-4">
                          <h3 className="text-lg font-semibold text-secondary-700 mb-2">🔄 การยกเลิกคำสั่งซื้อ</h3>
                          <p className="text-secondary-600">
                            สามารถยกเลิกได้ภายใน 5 นาทีหลังสั่งซื้อ หากเกินเวลานี้ กรุณาติดต่อศูนย์บริการลูกค้า
                          </p>
                        </div>
                        <div className="border-b border-secondary-200 pb-4">
                          <h3 className="text-lg font-semibold text-secondary-700 mb-2">💰 ค่าจัดส่ง</h3>
                          <p className="text-secondary-600">
                            ค่าจัดส่งเริ่มต้น 15 บาท และอาจแตกต่างกันตามระยะทาง สำหรับคำสั่งซื้อตั้งแต่ 200 บาทขึ้นไป ฟรีค่าจัดส่ง
                          </p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-secondary-700 mb-2">🆘 ติดต่อเรา</h3>
                          <p className="text-secondary-600">
                            หากไม่พบคำตอบที่ต้องการ กรุณาติดต่อเราที่:<br/>
                            โทร: 02-xxx-xxxx | อีเมล: support@fooddelivery.com
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
                    <h1 className="text-3xl font-bold text-secondary-800 mb-6">ข้อกำหนดการใช้งาน</h1>
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">1. การยอมรับข้อกำหนด</h2>
                          <p className="text-secondary-600">
                            การใช้บริการของเราถือว่าคุณยอมรับและตกลงปฏิบัติตามข้อกำหนดและเงื่อนไขทั้งหมดที่ระบุไว้
                          </p>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">2. การสร้างบัญชีผู้ใช้</h2>
                          <p className="text-secondary-600">
                            • คุณต้องมีอายุ 18 ปีขึ้นไป หรือได้รับอนุญาตจากผู้ปกครอง<br/>
                            • ข้อมูลที่ให้มาต้องถูกต้องและเป็นปัจจุบัน<br/>
                            • คุณรับผิดชอบในการรักษาความปลอดภัยของรหัสผ่าน
                          </p>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">3. การสั่งซื้อและการชำระเงิน</h2>
                          <p className="text-secondary-600">
                            • ราคาที่แสดงรวมภาษีมูลค่าเพิ่มแล้ว<br/>
                            • การชำระเงินต้องทำผ่านช่องทางที่เรากำหนด<br/>
                            • การยกเลิกคำสั่งซื้อสามารถทำได้ภายใน 5 นาทีหลังสั่งซื้อ
                          </p>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">4. การจัดส่ง</h2>
                          <p className="text-secondary-600">
                            • เราพยายามจัดส่งตามเวลาที่กำหนด แต่อาจมีความล่าช้าได้<br/>
                            • ผู้รับต้องมีอายุ 18 ปีขึ้นไปหรือมีผู้ใหญ่ร่วมรับ<br/>
                            • หากไม่มีคนรับ จะมีการติดต่อกลับภายใน 15 นาที
                          </p>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">5. การคืนเงินและการรับประกัน</h2>
                          <p className="text-secondary-600">
                            • หากอาหารมีปัญหาในด้านคุณภาพ จะมีการคืนเงินหรือส่งใหม่<br/>
                            • ต้องแจ้งปัญหาภายใน 1 ชั่วโมงหลังได้รับอาหาร<br/>
                            • การคืนเงินจะดำเนินการภายใน 7-14 วันทำการ
                          </p>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">6. ข้อจำกัดความรับผิดชอบ</h2>
                          <p className="text-secondary-600">
                            เราไม่รับผิดชอบต่อความเสียหายที่เกิดจากการใช้บริการ ยกเว้นในกรณีที่เกิดจากความประมาทของเรา
                          </p>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">7. การแก้ไขข้อกำหนด</h2>
                          <p className="text-secondary-600">
                            เราสงวนสิทธิ์ในการแก้ไขข้อกำหนดได้ตลอดเวลา โดยจะแจ้งให้ทราบล่วงหน้า 30 วัน
                          </p>
                        </div>
                        <div className="bg-secondary-50 p-4 rounded-lg">
                          <p className="text-sm text-secondary-600">
                            <strong>วันที่มีผลบังคับใช้:</strong> 1 มกราคม 2024<br/>
                            <strong>ติดต่อเรา:</strong> legal@fooddelivery.com | 02-xxx-xxxx
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
                    <h1 className="text-3xl font-bold text-secondary-800 mb-6">นโยบายความเป็นส่วนตัว</h1>
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-blue-800">
                            <strong>เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ</strong> นโยบายนี้อธิบายวิธีการเก็บ ใช้ และปกป้องข้อมูลส่วนบุคคลของคุณ
                          </p>
                        </div>
                        
                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">1. ข้อมูลที่เราเก็บรวบรวม</h2>
                          <p className="text-secondary-600 mb-2">เราเก็บรวบรวมข้อมูลต่อไปนี้:</p>
                          <ul className="list-disc list-inside text-secondary-600 space-y-1">
                            <li>ข้อมูลส่วนตัว: ชื่อ, อีเมล, เบอร์โทรศัพท์</li>
                            <li>ข้อมูลที่อยู่: ที่อยู่จัดส่ง, พิกัด GPS</li>
                            <li>ข้อมูลการสั่งซื้อ: ประวัติการสั่งซื้อ, การชำระเงิน</li>
                            <li>ข้อมูลการใช้งาน: การเข้าชมเว็บไซต์, การคลิก</li>
                          </ul>
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">2. วัตถุประสงค์การใช้ข้อมูล</h2>
                          <ul className="list-disc list-inside text-secondary-600 space-y-1">
                            <li>ประมวลผลและจัดส่งคำสั่งซื้อ</li>
                            <li>ติดต่อสื่อสารและแจ้งข่าวสาร</li>
                            <li>ปรับปรุงบริการและประสบการณ์การใช้งาน</li>
                            <li>วิเคราะห์พฤติกรรมการใช้งานเพื่อพัฒนาบริการ</li>
                            <li>ป้องกันการทุจริตและรักษาความปลอดภัย</li>
                          </ul>
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">3. การแบ่งปันข้อมูล</h2>
                          <p className="text-secondary-600 mb-2">เราจะแบ่งปันข้อมูลในกรณีต่อไปนี้เท่านั้น:</p>
                          <ul className="list-disc list-inside text-secondary-600 space-y-1">
                            <li>กับร้านอาหารและผู้ส่งอาหารเพื่อดำเนินการจัดส่ง</li>
                            <li>กับผู้ให้บริการชำระเงินเพื่อประมวลผลการชำระเงิน</li>
                            <li>เมื่อได้รับคำสั่งจากศาลหรือหน่วยงานราชการ</li>
                            <li>เพื่อปกป้องสิทธิและความปลอดภัยของเรา</li>
                          </ul>
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">4. ความปลอดภัยของข้อมูล</h2>
                          <p className="text-secondary-600">
                            เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสม เช่น การเข้ารหัสข้อมูล, การควบคุมการเข้าถึง, 
                            และการตรวจสอบระบบอย่างสม่ำเสมอ เพื่อป้องกันการเข้าถึง, ใช้, หรือเปิดเผยข้อมูลโดยไม่ได้รับอนุญาต
                          </p>
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">5. สิทธิของคุณ</h2>
                          <p className="text-secondary-600 mb-2">คุณมีสิทธิในการ:</p>
                          <ul className="list-disc list-inside text-secondary-600 space-y-1">
                            <li>เข้าถึงและขอสำเนาข้อมูลส่วนบุคคล</li>
                            <li>แก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่สมบูรณ์</li>
                            <li>ลบข้อมูลส่วนบุคคล (ยกเว้นกรณีที่กฎหมายกำหนด)</li>
                            <li>คัดค้านการประมวลผลข้อมูล</li>
                            <li>ถอนความยินยอมได้ตลอดเวลา</li>
                          </ul>
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">6. คุกกี้ (Cookies)</h2>
                          <p className="text-secondary-600">
                            เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์การใช้งาน วิเคราะห์การใช้งาน และแสดงโฆษณาที่เกี่ยวข้อง
                            คุณสามารถจัดการการตั้งค่าคุกกี้ในเบราว์เซอร์ของคุณได้
                          </p>
                        </div>

                        <div>
                          <h2 className="text-xl font-semibold text-secondary-700 mb-3">7. การติดต่อเรา</h2>
                          <p className="text-secondary-600">
                            หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัว หรือต้องการใช้สิทธิของคุณ 
                            กรุณาติดต่อเราที่ privacy@fooddelivery.com หรือ 02-xxx-xxxx
                          </p>
                        </div>

                        <div className="bg-secondary-50 p-4 rounded-lg">
                          <p className="text-sm text-secondary-600">
                            <strong>การแก้ไขนโยบาย:</strong> เราอาจแก้ไขนโยบายนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลใช้บังคับทันทีที่ประกาศบนเว็บไซต์<br/>
                            <strong>วันที่ปรับปรุงล่าสุด:</strong> 1 มกราคม 2024
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
                    <h1 className="text-3xl font-bold text-secondary-800 mb-6">รายการโปรด</h1>
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <div className="text-6xl mb-4 opacity-30">❤️</div>
                      <h2 className="text-xl font-semibold text-secondary-700 mb-2">ยังไม่มีรายการโปรด</h2>
                      <p className="text-secondary-500 mb-6">เพิ่มร้านอาหารหรือเมนูที่คุณชื่นชอบเป็นรายการโปรด</p>
                      <Link to="/restaurants" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors inline-block">
                        ค้นหาร้านอาหาร
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
                    <h1 className="text-3xl font-bold text-secondary-800 mb-6">ที่อยู่ของฉัน</h1>
                    <div className="bg-white rounded-lg shadow-md p-8">
                      <div className="text-center mb-8">
                        <div className="text-6xl mb-4 opacity-30">📍</div>
                        <h2 className="text-xl font-semibold text-secondary-700 mb-2">ยังไม่มีที่อยู่</h2>
                        <p className="text-secondary-500 mb-6">เพิ่มที่อยู่เพื่อการจัดส่งที่สะดวกยิ่งขึ้น</p>
                        <button className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors">
                          เพิ่มที่อยู่ใหม่
                        </button>
                      </div>
                      <div className="border-t pt-6">
                        <p className="text-sm text-secondary-500 text-center">
                          ฟีเจอร์การจัดการที่อยู่กำลังพัฒนา
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
                    <h1 className="text-3xl font-bold text-secondary-800 mb-6">แดชบอร์ดร้านอาหาร</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                          <div className="text-3xl text-blue-500 mr-4">📋</div>
                          <div>
                            <h3 className="text-lg font-semibold text-secondary-700">คำสั่งซื้อวันนี้</h3>
                            <p className="text-2xl font-bold text-secondary-800">0</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                          <div className="text-3xl text-green-500 mr-4">💰</div>
                          <div>
                            <h3 className="text-lg font-semibold text-secondary-700">ยอดขายวันนี้</h3>
                            <p className="text-2xl font-bold text-secondary-800">฿0</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                          <div className="text-3xl text-yellow-500 mr-4">🍽️</div>
                          <div>
                            <h3 className="text-lg font-semibold text-secondary-700">เมนูทั้งหมด</h3>
                            <p className="text-2xl font-bold text-secondary-800">0</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center">
                          <div className="text-3xl text-orange-500 mr-4">⭐</div>
                          <div>
                            <h3 className="text-lg font-semibold text-secondary-700">คะแนนเฉลี่ย</h3>
                            <p className="text-2xl font-bold text-secondary-800">0.0</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <div className="text-6xl mb-4 opacity-30">🚀</div>
                      <h2 className="text-xl font-semibold text-secondary-700 mb-2">เริ่มต้นการจัดการร้านของคุณ</h2>
                      <p className="text-secondary-500 mb-6">เพิ่มเมนูอาหาร จัดการคำสั่งซื้อ และติดตามยอดขาย</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/restaurant/menu" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors">
                          จัดการเมนู
                        </Link>
                        <Link to="/restaurant/orders" className="bg-secondary-200 text-secondary-700 px-6 py-3 rounded-lg hover:bg-secondary-300 transition-colors">
                          ดูคำสั่งซื้อ
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
                    <h1 className="text-2xl font-bold">จัดการเมนู</h1>
                    <p className="text-secondary-600 mt-2">กำลังพัฒนา...</p>
                  </div>
                </RestaurantLayout>
              </ProtectedRoute>
            } />

            <Route path="/restaurant/reviews" element={
              <ProtectedRoute allowedRoles={['general_restaurant', 'special_restaurant']}>
                <RestaurantLayout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">รีวิวร้านอาหาร</h1>
                    <p className="text-secondary-600 mt-2">กำลังพัฒนา...</p>
                  </div>
                </RestaurantLayout>
              </ProtectedRoute>
            } />

            <Route path="/restaurant/analytics" element={
              <ProtectedRoute allowedRoles={['general_restaurant', 'special_restaurant']}>
                <RestaurantLayout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">สถิติร้านอาหาร</h1>
                    <p className="text-secondary-600 mt-2">กำลังพัฒนา...</p>
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

            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">รายงานและสถิติ</h1>
                    <p className="text-secondary-600 mt-2">กำลังพัฒนา...</p>
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
            </CartProvider>
          </AuthProvider>
      </ErrorBoundary>
    );
  }

export default App;
