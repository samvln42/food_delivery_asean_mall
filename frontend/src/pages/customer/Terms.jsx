import React from 'react';

const Terms = () => {
  return (
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
  );
};

export default Terms;
