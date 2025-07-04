-- Insert default language (English)
INSERT INTO Languages (code, name, is_default, is_active)
VALUES ('en', 'English', TRUE, TRUE);

-- Get the language_id for English
SET @en_lang_id = LAST_INSERT_ID();

-- Insert translations for Common group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'common.welcome', 'Welcome', 'common'),
(@en_lang_id, 'common.login', 'Login', 'common'),
(@en_lang_id, 'common.register', 'Register', 'common'),
(@en_lang_id, 'common.logout', 'Logout', 'common'),
(@en_lang_id, 'common.profile', 'Profile', 'common'),
(@en_lang_id, 'common.settings', 'Settings', 'common'),
(@en_lang_id, 'common.save', 'Save', 'common'),
(@en_lang_id, 'common.cancel', 'Cancel', 'common'),
(@en_lang_id, 'common.delete', 'Delete', 'common'),
(@en_lang_id, 'common.edit', 'Edit', 'common'),
(@en_lang_id, 'common.search', 'Search', 'common'),
(@en_lang_id, 'common.back', 'Back', 'common'),
(@en_lang_id, 'common.loading', 'Loading...', 'common'),
(@en_lang_id, 'common.error', 'Error', 'common'),
(@en_lang_id, 'common.success', 'Success', 'common'),
(@en_lang_id, 'common.yes', 'Yes', 'common'),
(@en_lang_id, 'common.no', 'No', 'common'),
(@en_lang_id, 'common.confirm', 'Confirm', 'common'),
(@en_lang_id, 'common.submit', 'Submit', 'common'),
(@en_lang_id, 'common.close', 'Close', 'common'),
(@en_lang_id, 'common.view', 'View', 'common'),
(@en_lang_id, 'common.details', 'Details', 'common'),
(@en_lang_id, 'common.status', 'Status', 'common'),
(@en_lang_id, 'common.actions', 'Actions', 'common'),
(@en_lang_id, 'common.home', 'Home', 'common'),
(@en_lang_id, 'common.about', 'About', 'common'),
(@en_lang_id, 'common.contact', 'Contact', 'common');

-- Insert translations for Authentication group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'auth.email', 'Email', 'auth'),
(@en_lang_id, 'auth.password', 'Password', 'auth'),
(@en_lang_id, 'auth.confirm_password', 'Confirm Password', 'auth'),
(@en_lang_id, 'auth.forgot_password', 'Forgot Password?', 'auth'),
(@en_lang_id, 'auth.reset_password', 'Reset Password', 'auth'),
(@en_lang_id, 'auth.change_password', 'Change Password', 'auth'),
(@en_lang_id, 'auth.login_success', 'Login successful', 'auth'),
(@en_lang_id, 'auth.register_success', 'Registration successful', 'auth'),
(@en_lang_id, 'auth.logout_success', 'Logout successful', 'auth'),
(@en_lang_id, 'auth.verify_email', 'Verify Email', 'auth'),
(@en_lang_id, 'auth.email_verification', 'Email Verification', 'auth'),
(@en_lang_id, 'auth.email_verified', 'Email verified successfully', 'auth'),
(@en_lang_id, 'auth.google_login', 'Login with Google', 'auth'),
(@en_lang_id, 'auth.verification_sent', 'Verification email sent', 'auth'),
(@en_lang_id, 'auth.verification_required', 'Email verification required', 'auth'),
(@en_lang_id, 'auth.username', 'Username / Email', 'auth'),
(@en_lang_id, 'auth.remember_me', 'Remember me', 'auth'),
(@en_lang_id, 'auth.or', 'Or', 'auth'),
(@en_lang_id, 'auth.register_now', 'Register now', 'auth'),
(@en_lang_id, 'auth.login_now', 'Login now', 'auth'),
(@en_lang_id, 'auth.verify_email_title', 'Verify your email', 'auth'),
(@en_lang_id, 'auth.verify_email_message', 'We have sent a verification code to {email}. Please check your email and enter the verification code below', 'auth'),
(@en_lang_id, 'auth.verification_code', 'Verification Code', 'auth'),
(@en_lang_id, 'auth.verification_code_placeholder', 'Enter verification code from email', 'auth'),
(@en_lang_id, 'auth.verification_code_format', 'Verification code will be like: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', 'auth'),
(@en_lang_id, 'auth.verifying', 'Verifying email...', 'auth'),
(@en_lang_id, 'auth.verify_success', 'Email verified! You can now login', 'auth'),
(@en_lang_id, 'auth.resend_code', 'Resend verification code', 'auth'),
(@en_lang_id, 'auth.resend_success', 'Resent verification email to {email}', 'auth'),
(@en_lang_id, 'auth.resend_countdown', 'You can resend in {seconds} seconds', 'auth'),
(@en_lang_id, 'auth.agree_terms', 'I agree to the terms and conditions', 'auth'),
(@en_lang_id, 'auth.required_field', 'Required field', 'auth'),
(@en_lang_id, 'auth.phone', 'Phone number', 'auth'),
(@en_lang_id, 'auth.address', 'Address', 'auth'),
(@en_lang_id, 'auth.role', 'Role', 'auth'),
(@en_lang_id, 'auth.customer', 'Customer', 'auth'),
(@en_lang_id, 'auth.restaurant', 'Restaurant', 'auth');

-- Insert translations for Validation group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'validation.required', 'This field is required', 'validation'),
(@en_lang_id, 'validation.email_invalid', 'Invalid email address', 'validation'),
(@en_lang_id, 'validation.password_mismatch', 'Passwords do not match', 'validation'),
(@en_lang_id, 'validation.password_length', 'Password must be at least 8 characters', 'validation'),
(@en_lang_id, 'validation.invalid_credentials', 'Invalid credentials', 'validation');

-- Insert translations for Restaurant group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'restaurant.name', 'Restaurant Name', 'restaurant'),
(@en_lang_id, 'restaurant.description', 'Description', 'restaurant'),
(@en_lang_id, 'restaurant.address', 'Address', 'restaurant'),
(@en_lang_id, 'restaurant.phone', 'Phone Number', 'restaurant'),
(@en_lang_id, 'restaurant.opening_hours', 'Opening Hours', 'restaurant'),
(@en_lang_id, 'restaurant.categories', 'Categories', 'restaurant'),
(@en_lang_id, 'restaurant.menu', 'Menu', 'restaurant'),
(@en_lang_id, 'restaurant.reviews', 'Reviews', 'restaurant'),
(@en_lang_id, 'restaurant.rating', 'Rating', 'restaurant'),
(@en_lang_id, 'restaurant.status', 'Status', 'restaurant'),
(@en_lang_id, 'restaurant.create', 'Create Restaurant', 'restaurant'),
(@en_lang_id, 'restaurant.edit', 'Edit Restaurant', 'restaurant'),
(@en_lang_id, 'restaurant.delete', 'Delete Restaurant', 'restaurant');

-- Insert translations for Product group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'product.name', 'Product Name', 'product'),
(@en_lang_id, 'product.description', 'Description', 'product'),
(@en_lang_id, 'product.price', 'Price', 'product'),
(@en_lang_id, 'product.category', 'Category', 'product'),
(@en_lang_id, 'product.image', 'Image', 'product'),
(@en_lang_id, 'product.quantity', 'Quantity', 'product'),
(@en_lang_id, 'product.availability', 'Availability', 'product'),
(@en_lang_id, 'product.create', 'Create Product', 'product'),
(@en_lang_id, 'product.edit', 'Edit Product', 'product'),
(@en_lang_id, 'product.delete', 'Delete Product', 'product');

-- Insert translations for Order group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'order.number', 'Order Number', 'order'),
(@en_lang_id, 'order.status', 'Order Status', 'order'),
(@en_lang_id, 'order.total', 'Total Amount', 'order'),
(@en_lang_id, 'order.items', 'Order Items', 'order'),
(@en_lang_id, 'order.date', 'Order Date', 'order'),
(@en_lang_id, 'order.delivery_address', 'Delivery Address', 'order'),
(@en_lang_id, 'order.payment_method', 'Payment Method', 'order'),
(@en_lang_id, 'order.status.pending', 'Pending', 'order'),
(@en_lang_id, 'order.status.confirmed', 'Confirmed', 'order'),
(@en_lang_id, 'order.status.preparing', 'Preparing', 'order'),
(@en_lang_id, 'order.status.ready', 'Ready for Delivery', 'order'),
(@en_lang_id, 'order.status.delivering', 'Out for Delivery', 'order'),
(@en_lang_id, 'order.status.delivered', 'Delivered', 'order'),
(@en_lang_id, 'order.status.cancelled', 'Cancelled', 'order');

-- Insert translations for Cart group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'cart.empty', 'Your cart is empty', 'cart'),
(@en_lang_id, 'cart.add', 'Add to Cart', 'cart'),
(@en_lang_id, 'cart.remove', 'Remove from Cart', 'cart'),
(@en_lang_id, 'cart.clear', 'Clear Cart', 'cart'),
(@en_lang_id, 'cart.checkout', 'Checkout', 'cart'),
(@en_lang_id, 'cart.total', 'Total', 'cart'),
(@en_lang_id, 'cart.items', 'Items in Cart', 'cart'),
(@en_lang_id, 'cart.add_items', 'Add items to cart', 'cart');

-- Insert translations for Profile group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'profile.personal_info', 'Personal Information', 'profile'),
(@en_lang_id, 'profile.update', 'Update Profile', 'profile'),
(@en_lang_id, 'profile.orders', 'My Orders', 'profile'),
(@en_lang_id, 'profile.favorites', 'My Favorites', 'profile'),
(@en_lang_id, 'profile.addresses', 'My Addresses', 'profile'),
(@en_lang_id, 'profile.notifications', 'My Notifications', 'profile');

-- Insert translations for Error Messages group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'error.general', 'Something went wrong', 'error'),
(@en_lang_id, 'error.network', 'Network error', 'error'),
(@en_lang_id, 'error.unauthorized', 'Unauthorized access', 'error'),
(@en_lang_id, 'error.not_found', 'Not found', 'error'),
(@en_lang_id, 'error.server_error', 'Server error', 'error'),
(@en_lang_id, 'error.forbidden', 'Access forbidden', 'error');

-- Insert translations for Notifications group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'notification.new_order', 'New Order', 'notification'),
(@en_lang_id, 'notification.order_status', 'Order Status Updated', 'notification'),
(@en_lang_id, 'notification.order_cancelled', 'Order Cancelled', 'notification'),
(@en_lang_id, 'notification.profile_updated', 'Profile Updated', 'notification');

-- Insert translations for Dashboard group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'dashboard.overview', 'Overview', 'dashboard'),
(@en_lang_id, 'dashboard.sales', 'Sales', 'dashboard'),
(@en_lang_id, 'dashboard.orders', 'Orders', 'dashboard'),
(@en_lang_id, 'dashboard.customers', 'Customers', 'dashboard'),
(@en_lang_id, 'dashboard.popular_items', 'Popular Items', 'dashboard'),
(@en_lang_id, 'dashboard.recent_orders', 'Recent Orders', 'dashboard'),
(@en_lang_id, 'dashboard.statistics', 'Statistics', 'dashboard');

-- Insert translations for Admin group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'admin.users', 'Users Management', 'admin'),
(@en_lang_id, 'admin.restaurants', 'Restaurants Management', 'admin'),
(@en_lang_id, 'admin.categories', 'Categories Management', 'admin'),
(@en_lang_id, 'admin.orders', 'Orders Management', 'admin'),
(@en_lang_id, 'admin.settings', 'System Settings', 'admin'),
(@en_lang_id, 'admin.notifications', 'System Notifications', 'admin');

-- Insert translations for Favorites group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'favorites.title', 'Favorite list', 'favorites'),
(@en_lang_id, 'favorites.empty', 'No favorite list', 'favorites'),
(@en_lang_id, 'favorites.add', 'Add to favorites', 'favorites'),
(@en_lang_id, 'favorites.remove', 'Remove from favorites', 'favorites'),
(@en_lang_id, 'favorites.empty_message', 'Add your favorite restaurant or menu to the favorite list', 'favorites'),
(@en_lang_id, 'favorites.search_restaurant', 'Search for restaurant', 'favorites');

-- Insert translations for Address group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'address.title', 'My address', 'address'),
(@en_lang_id, 'address.empty', 'No address', 'address'),
(@en_lang_id, 'address.add', 'Add new address', 'address'),
(@en_lang_id, 'address.empty_message', 'Add your address for convenient delivery', 'address'),
(@en_lang_id, 'address.development_notice', 'Feature to manage address is under development', 'address');

-- Insert translations for Settings group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'settings.general', 'General Settings', 'settings'),
(@en_lang_id, 'settings.account', 'Account Settings', 'settings'),
(@en_lang_id, 'settings.privacy', 'Privacy Settings', 'settings'),
(@en_lang_id, 'settings.notifications', 'Notification Settings', 'settings'),
(@en_lang_id, 'settings.language', 'Language Settings', 'settings'),
(@en_lang_id, 'settings.appearance', 'Appearance Settings', 'settings');

-- Insert translations for About group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'about.title', 'About Us', 'about'),
(@en_lang_id, 'about.mission', 'Our Mission', 'about'),
(@en_lang_id, 'about.mission_text', 'We are a leading online food ordering platform that connects customers with high-quality restaurants to enjoy delicious food from their favorite places', 'about'),
(@en_lang_id, 'about.mission_text2', 'With advanced technology and friendly service we will provide a food ordering experience that is convenient fast and satisfying for you', 'about'),
(@en_lang_id, 'about.popularity', 'Our Popularity', 'about'),
(@en_lang_id, 'about.best_quality', 'Best food quality', 'about'),
(@en_lang_id, 'about.fast', 'Fast', 'about'),
(@en_lang_id, 'about.safe_delivery', 'Safe delivery', 'about'),
(@en_lang_id, 'about.local_support', 'Local restaurant support', 'about'),
(@en_lang_id, 'about.vision', 'Vision', 'about'),
(@en_lang_id, 'about.vision_text', 'We are a leading online food ordering platform that connects customers with high-quality restaurants to enjoy delicious food from their favorite places', 'about'),
(@en_lang_id, 'about.services', 'Our Services', 'about'),
(@en_lang_id, 'about.service_fast', 'Fast', 'about'),
(@en_lang_id, 'about.service_fast_text', 'Deliver food to your hand within 30-45 minutes', 'about'),
(@en_lang_id, 'about.service_quality', 'Good quality', 'about'),
(@en_lang_id, 'about.service_quality_text', 'Restaurant with good quality through selection', 'about'),
(@en_lang_id, 'about.service_payment', 'Easy payment', 'about'),
(@en_lang_id, 'about.service_payment_text', 'Support multiple payment methods', 'about');

-- Insert translations for Contact group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'contact.title', 'Contact us', 'contact'),
(@en_lang_id, 'contact.phone', 'Phone', 'contact'),
(@en_lang_id, 'contact.email', 'Email', 'contact'),
(@en_lang_id, 'contact.address', 'Address', 'contact'),
(@en_lang_id, 'contact.hours', 'Operating hours', 'contact'),
(@en_lang_id, 'contact.hours_text', 'Monday-Sunday 8:00-22:00', 'contact'),
(@en_lang_id, 'contact.form_title', 'Send us a message', 'contact'),
(@en_lang_id, 'contact.name', 'Name', 'contact'),
(@en_lang_id, 'contact.name_placeholder', 'Enter your name', 'contact'),
(@en_lang_id, 'contact.email_placeholder', 'Enter your email', 'contact'),
(@en_lang_id, 'contact.subject', 'Subject', 'contact'),
(@en_lang_id, 'contact.subject_placeholder', 'Enter the subject of your message', 'contact'),
(@en_lang_id, 'contact.message', 'Message', 'contact'),
(@en_lang_id, 'contact.message_placeholder', 'Enter your message', 'contact'),
(@en_lang_id, 'contact.send', 'Send message', 'contact'),
(@en_lang_id, 'contact.sending', 'Sending...', 'contact'),
(@en_lang_id, 'contact.success', 'Message sent successfully. We will contact you within 24 hours', 'contact'),
(@en_lang_id, 'contact.error', 'Error sending message. Please try again', 'contact'),
(@en_lang_id, 'contact.fill_all', 'Please fill in all the information', 'contact'),
(@en_lang_id, 'contact.other_ways', 'Other ways', 'contact');

-- Insert translations for Help group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'help.title', 'Help Center', 'help'),
(@en_lang_id, 'help.faq', 'Frequently Asked Questions (FAQ)', 'help'),
(@en_lang_id, 'help.how_to_order', 'How to order food', 'help'),
(@en_lang_id, 'help.how_to_order_text', '1. Select a restaurant\n2. Select a menu and add to cart\n3. Check the list and fill in the delivery address\n4. Select a payment method and confirm the order', 'help'),
(@en_lang_id, 'help.how_to_pay', 'How to pay', 'help'),
(@en_lang_id, 'help.how_to_pay_text', 'We accept payment via credit card debit card bank transfer and cash on delivery (for some areas)', 'help'),
(@en_lang_id, 'help.delivery_time', 'Delivery time', 'help'),
(@en_lang_id, 'help.delivery_time_text', 'Normally it takes 30-45 minutes depending on the distance and the complexity of the order', 'help'),
(@en_lang_id, 'help.track_order', 'How to track the order', 'help'),
(@en_lang_id, 'help.track_order_text', 'You can track the order status in the "Order History" page or via email and SMS', 'help'),
(@en_lang_id, 'help.cancel_order', 'How to cancel the order', 'help'),
(@en_lang_id, 'help.cancel_order_text', 'You can cancel the order within 5 minutes after placing the order. If you exceed this time please contact the customer service', 'help'),
(@en_lang_id, 'help.delivery_fee', 'Delivery fee', 'help'),
(@en_lang_id, 'help.delivery_fee_text', 'The delivery fee is 15 baht and may vary depending on the distance. For orders over 200 baht delivery is free', 'help'),
(@en_lang_id, 'help.contact_us', 'Contact us', 'help'),
(@en_lang_id, 'help.contact_us_text', 'If you don''t find the answer you''re looking for please contact us at:\nPhone: {phone} | Email: {email}', 'help');

-- Insert translations for Terms group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'terms.title', 'Terms of Service', 'terms'),
(@en_lang_id, 'terms.acceptance', '1. Acceptance of Terms', 'terms'),
(@en_lang_id, 'terms.acceptance_text', 'By using our service you agree to comply with all terms and conditions outlined here', 'terms'),
(@en_lang_id, 'terms.account', '2. Account Creation', 'terms'),
(@en_lang_id, 'terms.account_text', '• You must be at least 18 years old or have parental consent\n• The information provided must be accurate and up-to-date\n• You are responsible for maintaining the security of your password', 'terms'),
(@en_lang_id, 'terms.ordering', '3. Ordering and Payment', 'terms'),
(@en_lang_id, 'terms.ordering_text', '• The price shown includes tax\n• Payment must be made through the channels we have set up\n• You can cancel the order within 5 minutes after placing the order', 'terms'),
(@en_lang_id, 'terms.delivery', '4. Delivery', 'terms'),
(@en_lang_id, 'terms.delivery_text', '• We try to deliver on time but there may be delays\n• The recipient must be at least 18 years old or have parental consent\n• If there is no one to receive we will contact you within 15 minutes', 'terms'),
(@en_lang_id, 'terms.refund', '5. Refund and Guarantee', 'terms'),
(@en_lang_id, 'terms.refund_text', '• If the food has quality issues we will refund or replace it\n• You must report the problem within 1 hour after receiving the food\n• Refunds will be processed within 7-14 business days', 'terms'),
(@en_lang_id, 'terms.liability', '6. Limitation of Liability', 'terms'),
(@en_lang_id, 'terms.liability_text', 'We are not responsible for any damage caused by the use of our service except in cases of our negligence', 'terms'),
(@en_lang_id, 'terms.modification', '7. Modification of Terms', 'terms'),
(@en_lang_id, 'terms.modification_text', 'We reserve the right to modify these terms at any time with advance notice of 30 days', 'terms'),
(@en_lang_id, 'terms.effective_date', 'Effective date', 'terms'),
(@en_lang_id, 'terms.contact_us', 'Contact us', 'terms');

-- Insert translations for Privacy group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@en_lang_id, 'privacy.title', 'Privacy Policy', 'privacy'),
(@en_lang_id, 'privacy.intro', 'Introduction', 'privacy'),
(@en_lang_id, 'privacy.intro_text', 'This Privacy Policy explains how we collect use and protect your personal information', 'privacy'),
(@en_lang_id, 'privacy.collection', 'Information We Collect', 'privacy'),
(@en_lang_id, 'privacy.collection_text', '• Personal information (name email phone number)\n• Delivery information (address delivery instructions)\n• Payment information\n• Device and usage information', 'privacy'),
(@en_lang_id, 'privacy.use', 'How We Use Your Information', 'privacy'),
(@en_lang_id, 'privacy.use_text', '• To process and deliver your orders\n• To communicate with you about your orders\n• To improve our services\n• To send promotional materials (with your consent)', 'privacy'),
(@en_lang_id, 'privacy.sharing', 'Information Sharing', 'privacy'),
(@en_lang_id, 'privacy.sharing_text', 'We do not sell your personal information. We share your information only with:\n• Restaurants to fulfill your orders\n• Delivery partners to deliver your orders\n• Payment processors to process payments', 'privacy'),
(@en_lang_id, 'privacy.security', 'Security', 'privacy'),
(@en_lang_id, 'privacy.security_text', 'We implement appropriate security measures to protect your personal information', 'privacy'),
(@en_lang_id, 'privacy.cookies', 'Cookies', 'privacy'),
(@en_lang_id, 'privacy.cookies_text', 'We use cookies to improve your experience and analyze website traffic', 'privacy'),
(@en_lang_id, 'privacy.rights', 'Your Rights', 'privacy'),
(@en_lang_id, 'privacy.rights_text', 'You have the right to:\n• Access your personal information\n• Correct your personal information\n• Delete your personal information\n• Object to processing of your personal information', 'privacy'),
(@en_lang_id, 'privacy.contact', 'Contact Us About Privacy', 'privacy'),
(@en_lang_id, 'privacy.contact_text', 'If you have any questions about this Privacy Policy contact us at: {email}', 'privacy'),
(@en_lang_id, 'privacy.updates', 'Updates to This Policy', 'privacy'),
(@en_lang_id, 'privacy.updates_text', 'We may update this policy from time to time. We will notify you of any significant changes', 'privacy'); 