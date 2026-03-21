import React from 'react';

const Privacy = () => {
  return (
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
              <p className="text-secondary-600">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="list-disc list-inside text-secondary-600 space-y-1 mt-2">
                <li>Restaurants and delivery partners to process orders</li>
                <li>Payment service providers to process payments</li>
                <li>Service providers who help us operate our business</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-secondary-700 mb-3">4. Data security</h2>
              <p className="text-secondary-600">
                We use industry-standard security measures to protect your information, including encryption and secure servers
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-secondary-700 mb-3">5. Your rights</h2>
              <p className="text-secondary-600 mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-secondary-600 space-y-1">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Request data portability</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-secondary-700 mb-3">6. Cookies</h2>
              <p className="text-secondary-600">
                We use cookies to improve your experience. You can manage cookie preferences in your browser settings
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
                <strong>Last updated:</strong> January 1, 2024<br/>
                <strong>Contact us:</strong> legal@fooddelivery.com | 02-xxx-xxxx
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
