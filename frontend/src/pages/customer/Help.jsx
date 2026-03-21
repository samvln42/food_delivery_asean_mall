import React from 'react';
import { FaPizzaSlice, FaCreditCard, FaTruck, FaBox, FaUndo, FaDollarSign, FaQuestionCircle } from 'react-icons/fa';

const Help = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-secondary-800 mb-6">Help Center</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-semibold text-secondary-700 mb-6">Frequently Asked Questions (FAQ)</h2>
          <div className="space-y-6">
            <div className="border-b border-secondary-200 pb-4">
              <h3 className="text-lg font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                <FaPizzaSlice className="w-5 h-5 text-primary-600" />
                How to order food
              </h3>
              <p className="text-secondary-600">
                1. Select a restaurant<br/>
                2. Select a menu and add to cart<br/>
                3. Check the list and fill in the delivery address<br/>
                4. Select a payment method and confirm the order
              </p>
            </div>
            <div className="border-b border-secondary-200 pb-4">
              <h3 className="text-lg font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                <FaCreditCard className="w-5 h-5 text-primary-600" />
                How to pay
              </h3>
              <p className="text-secondary-600">
                We accept payment via credit card, debit card, bank transfer, and cash on delivery (for some areas)
              </p>
            </div>
            <div className="border-b border-secondary-200 pb-4">
              <h3 className="text-lg font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                <FaTruck className="w-5 h-5 text-primary-600" />
                Delivery time
              </h3>
              <p className="text-secondary-600">
                Normally it takes 30-45 minutes, depending on the distance and the complexity of the order
              </p>
            </div>
            <div className="border-b border-secondary-200 pb-4">
              <h3 className="text-lg font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                <FaBox className="w-5 h-5 text-primary-600" />
                How to track the order
              </h3>
              <p className="text-secondary-600">
                You can track the order status in the "Order History" page or via email and SMS
              </p>
            </div>
            <div className="border-b border-secondary-200 pb-4">
              <h3 className="text-lg font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                <FaUndo className="w-5 h-5 text-primary-600" />
                How to cancel the order
              </h3>
              <p className="text-secondary-600">
                You can cancel the order within 5 minutes after placing the order. If you exceed this time, please contact the customer service
              </p>
            </div>
            <div className="border-b border-secondary-200 pb-4">
              <h3 className="text-lg font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                <FaDollarSign className="w-5 h-5 text-primary-600" />
                Delivery fee
              </h3>
              <p className="text-secondary-600">
                The delivery fee is 15 baht and may vary depending on the distance. For orders over 200 baht, delivery is free
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-secondary-700 mb-2 flex items-center gap-2">
                <FaQuestionCircle className="w-5 h-5 text-primary-600" />
                Contact us
              </h3>
              <p className="text-secondary-600">
                If you don't find the answer you're looking for, please contact us at:<br/>
                Phone: 02-xxx-xxxx | Email: support@fooddelivery.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
