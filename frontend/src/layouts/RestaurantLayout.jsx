import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';

const RestaurantLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <Header />
      </div>
      
      <div className="flex pt-16">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-20 left-4 z-30 p-2 rounded-md bg-white shadow-lg text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-10 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Fixed Sidebar */}
        <aside className={`fixed left-0 top-16 w-64 h-screen bg-white shadow-lg z-20 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <nav className="p-4">
            <div className="space-y-2">
              <Link
                to="/restaurant"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                📊 แดชบอร์ด
              </Link>
              <Link
                to="/restaurant/orders"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                📦 คำสั่งซื้อ
              </Link>
              <Link
                to="/restaurant/menu"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                🍽️ จัดการเมนู
              </Link>
              <Link
                to="/restaurant/reviews"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                ⭐ รีวิว
              </Link>
              <Link
                to="/restaurant/analytics"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                📈 สถิติ
              </Link>
              <Link
                to="/restaurant/profile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-4 py-2 text-secondary-700 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                🏪 ข้อมูลร้าน
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default RestaurantLayout; 