-- ตาราง Users (ผู้ใช้งาน)
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    address VARCHAR(255),
    role ENUM('admin', 'special_restaurant', 'general_restaurant', 'customer') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตาราง Restaurants (ร้านค้า) - เพิ่ม average_rating
CREATE TABLE Restaurants (
    restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL, -- FK to Users, owner of the restaurant
    restaurant_name VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    is_special BOOLEAN DEFAULT FALSE, -- TRUE for special restaurant, FALSE for general
    opening_hours VARCHAR(100),
    status ENUM('open', 'closed') DEFAULT 'open',
    qr_code_image_url VARCHAR(255), -- URL for QR code for payment
    bank_account_number VARCHAR(50),
    bank_name VARCHAR(100),
    account_name VARCHAR(100),
    average_rating DECIMAL(3,2) DEFAULT 0.00, -- คะแนนเฉลี่ย
    total_reviews INT DEFAULT 0, -- จำนวนรีวิวทั้งหมด
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ตาราง Categories (หมวดหมู่สินค้า)
CREATE TABLE Categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL
);

-- ตาราง Products (สินค้า/เมนู)
CREATE TABLE Products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    category_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id),
    FOREIGN KEY (category_id) REFERENCES Categories(category_id)
);

-- ตาราง Orders (คำสั่งซื้อ)
CREATE TABLE Orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Customer who placed the order
    restaurant_id INT NOT NULL, -- Restaurant receiving the order
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    delivery_address VARCHAR(255) NOT NULL, -- Full text address for delivery
    delivery_latitude DECIMAL(10, 8), -- Latitude for delivery location
    delivery_longitude DECIMAL(11, 8), -- Longitude for delivery location
    current_status ENUM('pending', 'paid', 'preparing', 'ready_for_pickup', 'delivering', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
    estimated_delivery_time DATETIME,
    is_reviewed BOOLEAN DEFAULT FALSE, -- Flag to check if the order has been reviewed
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id)
);

-- ตาราง Order_Details (รายละเอียดคำสั่งซื้อ)
CREATE TABLE Order_Details (
    order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_order DECIMAL(10, 2) NOT NULL, -- Price of the product when ordered
    subtotal DECIMAL(10, 2) NOT NULL, -- quantity * price_at_order
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- ตาราง Payments (การชำระเงิน) - ลบ cash_on_delivery
CREATE TABLE Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNIQUE NOT NULL, -- One payment per order
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount_paid DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('qr_code', 'bank_transfer') NOT NULL, -- ลบ cash_on_delivery
    transaction_id VARCHAR(100) UNIQUE, -- Transaction ID from payment gateway/bank
    status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    proof_of_payment_url VARCHAR(255), -- URL to image of payment proof (for QR/Bank Transfer)
    FOREIGN KEY (order_id) REFERENCES Orders(order_id)
);

-- ตาราง Reviews (รีวิวร้านค้า)
CREATE TABLE Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Customer who reviewed
    order_id INT UNIQUE NOT NULL, -- The specific order being reviewed (1 review per order for the restaurant)
    restaurant_id INT NOT NULL,
    rating_restaurant INT NOT NULL CHECK (rating_restaurant >= 1 AND rating_restaurant <= 5),
    comment_restaurant TEXT,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id)
);

-- ตาราง Product_Reviews (รีวิวสินค้าเฉพาะรายการ)
CREATE TABLE Product_Reviews (
    product_review_id INT AUTO_INCREMENT PRIMARY KEY,
    order_detail_id INT UNIQUE NOT NULL, -- The specific order detail item being reviewed
    user_id INT NOT NULL, -- Customer who reviewed
    product_id INT NOT NULL,
    rating_product INT NOT NULL CHECK (rating_product >= 1 AND rating_product <= 5),
    comment_product TEXT,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_detail_id) REFERENCES Order_Details(order_detail_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id)
);

-- ตาราง Delivery_Status_Log (บันทึกสถานะการจัดส่ง)
CREATE TABLE Delivery_Status_Log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    status ENUM('pending', 'paid', 'preparing', 'ready_for_pickup', 'delivering', 'completed', 'cancelled') NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    note VARCHAR(255),
    updated_by_user_id INT, -- User (admin or restaurant owner) who updated the status
    FOREIGN KEY (order_id) REFERENCES Orders(order_id),
    FOREIGN KEY (updated_by_user_id) REFERENCES Users(user_id)
);

-- ===== ตารางใหม่ที่เพิ่มเข้ามา =====

-- ตาราง Notifications (ระบบแจ้งเตือน)
CREATE TABLE Notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- ผู้รับการแจ้งเตือน
    title VARCHAR(100) NOT NULL, -- หัวข้อการแจ้งเตือน
    message TEXT NOT NULL, -- ข้อความแจ้งเตือน
    type ENUM('order_update', 'payment_confirm', 'review_reminder', 'promotion', 'system') NOT NULL,
    related_order_id INT NULL, -- เชื่อมกับคำสั่งซื้อ (ถ้ามี)
    is_read BOOLEAN DEFAULT FALSE, -- สถานะการอ่าน
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME NULL, -- เวลาที่อ่าน
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (related_order_id) REFERENCES Orders(order_id)
);

-- ตาราง Search_History (ประวัติการค้นหา)
CREATE TABLE Search_History (
    search_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- ผู้ค้นหา
    search_query VARCHAR(255) NOT NULL, -- คำค้นหา
    search_type ENUM('restaurant', 'product', 'category') NOT NULL, -- ประเภทการค้นหา
    results_count INT DEFAULT 0, -- จำนวนผลลัพธ์
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

-- ตาราง Popular_Searches (คำค้นหายอดนิยม)
CREATE TABLE Popular_Searches (
    popular_search_id INT AUTO_INCREMENT PRIMARY KEY,
    search_query VARCHAR(255) UNIQUE NOT NULL, -- คำค้นหา
    search_count INT DEFAULT 1, -- จำนวนครั้งที่ถูกค้นหา
    last_searched DATETIME DEFAULT CURRENT_TIMESTAMP, -- ครั้งล่าสุดที่ถูกค้นหา
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตาราง User_Favorites (รายการโปรด)
CREATE TABLE User_Favorites (
    favorite_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    restaurant_id INT NULL, -- ร้านค้าโปรด
    product_id INT NULL, -- เมนูโปรด
    favorite_type ENUM('restaurant', 'product') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id),
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    -- ตรวจสอบว่าต้องมี restaurant_id หรือ product_id อย่างใดอย่างหนึ่ง
    CHECK (
        (favorite_type = 'restaurant' AND restaurant_id IS NOT NULL AND product_id IS NULL) OR
        (favorite_type = 'product' AND product_id IS NOT NULL AND restaurant_id IS NOT NULL)
    )
);

-- ตาราง Analytics_Daily (สถิติรายวัน)
CREATE TABLE Analytics_Daily (
    analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    total_orders INT DEFAULT 0, -- จำนวนคำสั่งซื้อทั้งหมด
    total_revenue DECIMAL(12, 2) DEFAULT 0.00, -- รายได้รวม
    total_customers INT DEFAULT 0, -- จำนวนลูกค้า
    new_customers INT DEFAULT 0, -- ลูกค้าใหม่
    completed_orders INT DEFAULT 0, -- คำสั่งซื้อที่สำเร็จ
    cancelled_orders INT DEFAULT 0, -- คำสั่งซื้อที่ยกเลิก
    average_order_value DECIMAL(10, 2) DEFAULT 0.00, -- มูลค่าเฉลี่ยต่อคำสั่งซื้อ
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date (date)
);

-- ตาราง Restaurant_Analytics (สถิติของร้านค้า)
CREATE TABLE Restaurant_Analytics (
    restaurant_analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT NOT NULL,
    date DATE NOT NULL,
    total_orders INT DEFAULT 0, -- จำนวนคำสั่งซื้อ
    total_revenue DECIMAL(10, 2) DEFAULT 0.00, -- รายได้
    completed_orders INT DEFAULT 0, -- คำสั่งซื้อสำเร็จ
    cancelled_orders INT DEFAULT 0, -- คำสั่งซื้อยกเลิก
    average_order_value DECIMAL(10, 2) DEFAULT 0.00, -- มูลค่าเฉลี่ย
    new_reviews INT DEFAULT 0, -- รีวิวใหม่
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id),
    UNIQUE KEY restaurant_date (restaurant_id, date)
);

-- ตาราง Product_Analytics (สถิติของสินค้า)
CREATE TABLE Product_Analytics (
    product_analytics_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    date DATE NOT NULL,
    total_ordered INT DEFAULT 0, -- จำนวนที่ถูกสั่ง
    total_quantity INT DEFAULT 0, -- จำนวนรวม
    total_revenue DECIMAL(10, 2) DEFAULT 0.00, -- รายได้จากสินค้านี้
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Products(product_id),
    FOREIGN KEY (restaurant_id) REFERENCES Restaurants(restaurant_id),
    UNIQUE KEY product_date (product_id, date)
);

-- ===== Triggers สำหรับ average_rating =====

DELIMITER //

-- Trigger เมื่อมีรีวิวใหม่
CREATE TRIGGER update_restaurant_rating_after_insert
AFTER INSERT ON Reviews
FOR EACH ROW
BEGIN
    UPDATE Restaurants 
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating_restaurant), 2) 
            FROM Reviews 
            WHERE restaurant_id = NEW.restaurant_id
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM Reviews 
            WHERE restaurant_id = NEW.restaurant_id
        )
    WHERE restaurant_id = NEW.restaurant_id;
END//

-- Trigger เมื่อมีการแก้ไขรีวิว
CREATE TRIGGER update_restaurant_rating_after_update
AFTER UPDATE ON Reviews
FOR EACH ROW
BEGIN
    UPDATE Restaurants 
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating_restaurant), 2) 
            FROM Reviews 
            WHERE restaurant_id = NEW.restaurant_id
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM Reviews 
            WHERE restaurant_id = NEW.restaurant_id
        )
    WHERE restaurant_id = NEW.restaurant_id;
END//

-- Trigger เมื่อมีการลบรีวิว
CREATE TRIGGER update_restaurant_rating_after_delete
AFTER DELETE ON Reviews
FOR EACH ROW
BEGIN
    UPDATE Restaurants 
    SET 
        average_rating = COALESCE((
            SELECT ROUND(AVG(rating_restaurant), 2) 
            FROM Reviews 
            WHERE restaurant_id = OLD.restaurant_id
        ), 0),
        total_reviews = (
            SELECT COUNT(*) 
            FROM Reviews 
            WHERE restaurant_id = OLD.restaurant_id
        )
    WHERE restaurant_id = OLD.restaurant_id;
END//

DELIMITER ;

-- ===== Indexes สำหรับประสิทธิภาพ =====

-- Index สำหรับการค้นหา
CREATE INDEX idx_restaurants_name ON Restaurants(restaurant_name);
CREATE INDEX idx_restaurants_rating ON Restaurants(average_rating DESC);
CREATE INDEX idx_products_name ON Products(product_name);
CREATE INDEX idx_products_restaurant_available ON Products(restaurant_id, is_available);

-- Index สำหรับ Orders
CREATE INDEX idx_orders_user_date ON Orders(user_id, order_date DESC);
CREATE INDEX idx_orders_restaurant_date ON Orders(restaurant_id, order_date DESC);
CREATE INDEX idx_orders_status ON Orders(current_status);

-- Index สำหรับ Notifications
CREATE INDEX idx_notifications_user_unread ON Notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON Notifications(created_at DESC);

-- Index สำหรับ Search History
CREATE INDEX idx_search_history_user ON Search_History(user_id, created_at DESC);
CREATE INDEX idx_search_query ON Search_History(search_query);

-- Index สำหรับ Analytics
CREATE INDEX idx_analytics_date ON Analytics_Daily(date DESC);
CREATE INDEX idx_restaurant_analytics_date ON Restaurant_Analytics(restaurant_id, date DESC);
CREATE INDEX idx_product_analytics_date ON Product_Analytics(product_id, date DESC);

-- ===== อัปเดตข้อมูล average_rating ที่มีอยู่ =====

UPDATE Restaurants r
SET 
    average_rating = COALESCE((
        SELECT ROUND(AVG(rating_restaurant), 2) 
        FROM Reviews rev 
        WHERE rev.restaurant_id = r.restaurant_id
    ), 0),
    total_reviews = (
        SELECT COUNT(*) 
        FROM Reviews rev 
        WHERE rev.restaurant_id = r.restaurant_id
    );

-- ตาราง Languages (ภาษา)
CREATE TABLE Languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ตาราง Translations (การแปลภาษา)
CREATE TABLE Translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    language_id INT NOT NULL,
    `key` VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    `group` VARCHAR(100) NOT NULL COMMENT 'Group/category of the translation (e.g., common, menu, error)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (language_id) REFERENCES Languages(id),
    UNIQUE KEY unique_translation (language_id, `key`)
);

-- สร้าง Index สำหรับการค้นหา
CREATE INDEX idx_translations_key ON Translations(`key`);
CREATE INDEX idx_translations_group ON Translations(`group`);
CREATE INDEX idx_languages_code ON Languages(code);

-- เพิ่มข้อมูลภาษาอังกฤษเป็นภาษาเริ่มต้น
INSERT INTO Languages (code, name, is_default, is_active) VALUES ('en', 'English', TRUE, TRUE);