from rest_framework import serializers
from accounts.models import User
from .models import (
    Restaurant, Category, Product, Order, OrderDetail,
    Payment, Review, ProductReview, DeliveryStatusLog, Notification,
    SearchHistory, PopularSearch, UserFavorite, AnalyticsDaily,
    RestaurantAnalytics, ProductAnalytics, AppSettings
)


# User serializer moved to accounts app


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)
    image_display_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['category_id', 'category_name', 'description', 'image', 'image_display_url', 'is_special_only', 'products_count']
    
    def get_image_display_url(self, obj):
        """Get the category image URL"""
        image_url = obj.get_image_url()
        if image_url and not image_url.startswith('http'):
            # เพิ่ม domain สำหรับ relative URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            else:
                # Fallback สำหรับกรณีไม่มี request context
                from django.conf import settings
                return f"http://127.0.0.1:8000{image_url}"
        return image_url


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    restaurant_id = serializers.IntegerField(source='restaurant.restaurant_id', read_only=True)
    restaurant_status = serializers.CharField(source='restaurant.status', read_only=True)
    image_display_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['product_id', 'restaurant', 'restaurant_id', 'restaurant_name', 'restaurant_status', 'category', 
                 'category_name', 'product_name', 'description', 'price', 
                 'image_url', 'image', 'image_display_url', 'is_available', 'created_at', 'updated_at']
        read_only_fields = ['product_id', 'created_at', 'updated_at']
    
    def get_image_display_url(self, obj):
        """Get the best available image URL"""
        image_url = obj.get_image_url()
        if image_url and not image_url.startswith('http'):
            # เพิ่ม domain สำหรับ relative URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            else:
                # Fallback สำหรับกรณีไม่มี request context
                from django.conf import settings
                return f"http://127.0.0.1:8000{image_url}"
        return image_url
    
    def create(self, validated_data):
        """Custom create method to handle image upload"""
        # สร้างสินค้าตามปกติ
        product = Product.objects.create(**validated_data)
        return product


class RestaurantSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    products_count = serializers.IntegerField(source='products.count', read_only=True)
    image_display_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = ['restaurant_id', 'user', 'user_username', 'restaurant_name', 
                 'description', 'address', 'phone_number', 'is_special', 
                 'opening_hours', 'status', 'image', 'image_url', 'image_display_url', 'qr_code_image_url', 
                 'bank_account_number', 'bank_name', 'account_name', 
                 'average_rating', 'total_reviews', 'products_count', 
                 'created_at', 'updated_at']
        read_only_fields = ['restaurant_id', 'average_rating', 'total_reviews', 
                          'created_at', 'updated_at']
    
    def get_image_display_url(self, obj):
        """Get the best available image URL"""
        image_url = obj.get_image_url()
        if image_url and not image_url.startswith('http'):
            # เพิ่ม domain สำหรับ relative URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            else:
                # Fallback สำหรับกรณีไม่มี request context
                from django.conf import settings
                return f"http://127.0.0.1:8000{image_url}"
        return image_url
    
    def update(self, instance, validated_data):
        """อัปเดทร้านและซิงก์ User role อัตโนมัติ"""
        old_is_special = instance.is_special
        
        # อัปเดทข้อมูลร้าน
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # ซิงก์ User role เมื่อ is_special เปลี่ยนแปลง
        if 'is_special' in validated_data and validated_data['is_special'] != old_is_special:
            user = instance.user
            new_role = 'special_restaurant' if validated_data['is_special'] else 'general_restaurant'
            
            if user.role != new_role:
                user.role = new_role
                user.save()
                print(f"🔄 Auto-sync: Restaurant {instance.restaurant_name} is_special={validated_data['is_special']} → User {user.username} role={new_role}")
        
        return instance


class OrderDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_image_url = serializers.CharField(source='product.image_url', read_only=True)
    restaurant_id = serializers.IntegerField(source='product.restaurant.restaurant_id', read_only=True)
    restaurant_name = serializers.CharField(source='product.restaurant.restaurant_name', read_only=True)
    
    class Meta:
        model = OrderDetail
        fields = ['order_detail_id', 'order', 'product', 'product_name', 'product_image_url',
                 'restaurant_id', 'restaurant_name', 'quantity', 'price_at_order', 'subtotal']
        read_only_fields = ['order_detail_id', 'subtotal']


class PaymentSerializer(serializers.ModelSerializer):
    proof_of_payment_display_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = ['payment_id', 'order', 'payment_date', 'amount_paid', 
                 'payment_method', 'transaction_id', 'status', 
                 'proof_of_payment_url', 'proof_of_payment', 'proof_of_payment_display_url']
        read_only_fields = ['payment_id', 'payment_date']
    
    def get_proof_of_payment_display_url(self, obj):
        """Get the best available proof of payment URL"""
        if obj.proof_of_payment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.proof_of_payment.url)
            return obj.proof_of_payment.url
        return obj.proof_of_payment_url


class OrderSerializer(serializers.ModelSerializer):
    order_details = OrderDetailSerializer(many=True, read_only=True)
    order_details_by_restaurant = serializers.SerializerMethodField()
    payment = PaymentSerializer(read_only=True)
    customer_name = serializers.CharField(source='user.username', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    restaurant_count = serializers.SerializerMethodField()
    is_multi_restaurant = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['order_id', 'user', 'customer_name', 'restaurant', 
                 'restaurant_name', 'order_date', 'total_amount', 
                 'delivery_address', 'delivery_latitude', 'delivery_longitude', 
                 'current_status', 'delivery_fee', 'estimated_delivery_time', 
                 'is_reviewed', 'order_details', 'order_details_by_restaurant',
                 'restaurant_count', 'is_multi_restaurant', 'payment']
        read_only_fields = ['order_id', 'order_date']
    
    def get_order_details_by_restaurant(self, obj):
        """จัดกลุ่ม OrderDetail ตามร้าน"""
        order_details = obj.order_details.all()
        restaurants = {}
        
        for detail in order_details:
            restaurant_id = detail.product.restaurant.restaurant_id
            restaurant_name = detail.product.restaurant.restaurant_name
            
            if restaurant_id not in restaurants:
                restaurants[restaurant_id] = {
                    'restaurant_id': restaurant_id,
                    'restaurant_name': restaurant_name,
                    'restaurant_address': detail.product.restaurant.address or '',
                    'items': [],
                    'subtotal': 0
                }
            
            item_data = OrderDetailSerializer(detail).data
            restaurants[restaurant_id]['items'].append(item_data)
            restaurants[restaurant_id]['subtotal'] += float(detail.subtotal)
        
        return list(restaurants.values())
    
    def get_restaurant_count(self, obj):
        """นับจำนวนร้านในคำสั่งซื้อ"""
        return obj.order_details.values('product__restaurant').distinct().count()
    
    def get_is_multi_restaurant(self, obj):
        """ตรวจสอบว่าเป็น multi-restaurant order หรือไม่"""
        return self.get_restaurant_count(obj) > 1


class CreateOrderSerializer(serializers.ModelSerializer):
    order_items = serializers.ListField(write_only=True)
    
    class Meta:
        model = Order
        fields = ['user', 'restaurant', 'delivery_address', 'delivery_latitude', 
                 'delivery_longitude', 'delivery_fee', 'order_items']
    
    def create(self, validated_data):
        order_items = validated_data.pop('order_items')
        
        # Calculate total amount
        total_amount = validated_data.get('delivery_fee', 0)
        for item in order_items:
            product = Product.objects.get(product_id=item['product_id'])
            total_amount += product.price * item['quantity']
        
        validated_data['total_amount'] = total_amount
        order = Order.objects.create(**validated_data)
        
        # Create order details
        for item in order_items:
            product = Product.objects.get(product_id=item['product_id'])
            OrderDetail.objects.create(
                order=order,
                product=product,
                quantity=item['quantity'],
                price_at_order=product.price
            )
        
        return order


class MultiRestaurantOrderSerializer(serializers.Serializer):
    """
    Serializer สำหรับการสั่งซื้อจากหลายร้านในครั้งเดียว
    ระบบจะสร้าง Order เดียวที่มี OrderDetail จากหลายร้าน
    """
    user = serializers.IntegerField()
    delivery_address = serializers.CharField(max_length=255)
    delivery_latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True)
    delivery_longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)
    total_delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    restaurants = serializers.JSONField(write_only=True)  # เปลี่ยนเป็น JSONField เพื่อรองรับ complex structure
    
    def validate_restaurants(self, value):
        """ตรวจสอบข้อมูลร้านและสินค้า"""
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError("ต้องมีอย่างน้อย 1 ร้าน และต้องเป็น list")
        
        for i, restaurant_data in enumerate(value):
            # ตรวจสอบ structure ของแต่ละร้าน
            if not isinstance(restaurant_data, dict):
                raise serializers.ValidationError(f"ข้อมูลร้านที่ {i+1} ต้องเป็น object")
            
            if 'restaurant_id' not in restaurant_data:
                raise serializers.ValidationError(f"ร้านที่ {i+1}: ต้องระบุ restaurant_id")
            if 'items' not in restaurant_data:
                raise serializers.ValidationError(f"ร้านที่ {i+1}: ต้องมีรายการสินค้า (items)")
            
            restaurant_id = restaurant_data.get('restaurant_id')
            items = restaurant_data.get('items')
            
            # ตรวจสอบ restaurant_id
            try:
                restaurant_id = int(restaurant_id)
                restaurant = Restaurant.objects.get(restaurant_id=restaurant_id)
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"ร้านที่ {i+1}: restaurant_id ต้องเป็นตัวเลข")
            except Restaurant.DoesNotExist:
                raise serializers.ValidationError(f"ไม่พบร้าน ID: {restaurant_id}")
            
            # ตรวจสอบ items
            if not isinstance(items, list) or not items:
                raise serializers.ValidationError(f"ร้านที่ {i+1}: ต้องมีรายการสินค้าอย่างน้อย 1 รายการ")
            
            # ตรวจสอบสินค้าในร้าน
            for j, item in enumerate(items):
                if not isinstance(item, dict):
                    raise serializers.ValidationError(f"ร้านที่ {i+1}, สินค้าที่ {j+1}: ต้องเป็น object")
                
                if 'product_id' not in item or 'quantity' not in item:
                    raise serializers.ValidationError(f"ร้านที่ {i+1}, สินค้าที่ {j+1}: ต้องมี product_id และ quantity")
                
                try:
                    product_id = int(item['product_id'])
                    quantity = int(item['quantity'])
                    
                    if quantity <= 0:
                        raise serializers.ValidationError(f"ร้านที่ {i+1}, สินค้าที่ {j+1}: จำนวนต้องมากกว่า 0")
                    
                    product = Product.objects.get(
                        product_id=product_id, 
                        restaurant=restaurant,
                        is_available=True
                    )
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"ร้านที่ {i+1}, สินค้าที่ {j+1}: product_id และ quantity ต้องเป็นตัวเลข")
                except Product.DoesNotExist:
                    raise serializers.ValidationError(
                        f"ไม่พบสินค้า ID: {product_id} ในร้าน {restaurant.restaurant_name}"
                    )
        
        return value
    
    def create(self, validated_data):
        restaurants_data = validated_data.pop('restaurants')
        
        # สร้าง Order หลัก (ไม่ผูกกับร้านใดร้านหนึ่ง)
        # NOTE: ต้องแก้ไข Model เพื่อให้ restaurant field เป็น optional
        
        # วิธีแก้ไขชั่วคราว: ใช้ร้านแรกเป็น primary restaurant
        first_restaurant_id = restaurants_data[0]['restaurant_id']
        primary_restaurant = Restaurant.objects.get(restaurant_id=first_restaurant_id)
        
        # คำนวณยอดรวม
        total_amount = validated_data.get('total_delivery_fee', 0)
        
        for restaurant_data in restaurants_data:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_data['restaurant_id'])
            for item_data in restaurant_data['items']:
                product = Product.objects.get(product_id=item_data['product_id'])
                total_amount += product.price * int(item_data['quantity'])
        
        # สร้าง Order
        order = Order.objects.create(
            user_id=validated_data['user'],
            restaurant=primary_restaurant,  # ชั่วคราว ใช้ร้านแรก
            delivery_address=validated_data['delivery_address'],
            delivery_latitude=validated_data.get('delivery_latitude'),
            delivery_longitude=validated_data.get('delivery_longitude'),
            delivery_fee=validated_data['total_delivery_fee'],
            total_amount=total_amount,
            current_status='pending'
        )
        
        # สร้าง OrderDetail สำหรับทุกสินค้าจากทุกร้าน
        for restaurant_data in restaurants_data:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_data['restaurant_id'])
            for item_data in restaurant_data['items']:
                product = Product.objects.get(product_id=item_data['product_id'])
                OrderDetail.objects.create(
                    order=order,
                    product=product,
                    quantity=int(item_data['quantity']),
                    price_at_order=product.price
                )
        
        # สร้าง status log
        DeliveryStatusLog.objects.create(
            order=order,
            status='pending',
            note=f'Multi-restaurant order created with {len(restaurants_data)} restaurants'
        )
        
        return order


class ReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    
    class Meta:
        model = Review
        fields = ['review_id', 'user', 'user_username', 'order', 'restaurant', 
                 'restaurant_name', 'rating_restaurant', 'comment_restaurant', 
                 'review_date']
        read_only_fields = ['review_id', 'review_date']


class ProductReviewSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    
    class Meta:
        model = ProductReview
        fields = ['product_review_id', 'order_detail', 'user', 'user_username', 
                 'product', 'product_name', 'rating_product', 'comment_product', 
                 'review_date']
        read_only_fields = ['product_review_id', 'review_date']


class DeliveryStatusLogSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by_user.username', read_only=True)
    
    class Meta:
        model = DeliveryStatusLog
        fields = ['log_id', 'order', 'status', 'timestamp', 'note', 
                 'updated_by_user', 'updated_by_username']
        read_only_fields = ['log_id', 'timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['notification_id', 'user', 'title', 'message', 'type', 
                 'related_order', 'is_read', 'created_at', 'read_at']
        read_only_fields = ['notification_id', 'created_at']


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ['search_id', 'user', 'search_query', 'search_type', 
                 'results_count', 'created_at']
        read_only_fields = ['search_id', 'created_at']


class PopularSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = PopularSearch
        fields = ['popular_search_id', 'search_query', 'search_count', 
                 'last_searched', 'updated_at']
        read_only_fields = ['popular_search_id', 'last_searched', 'updated_at']


class UserFavoriteSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    
    class Meta:
        model = UserFavorite
        fields = ['favorite_id', 'user', 'restaurant', 'restaurant_name', 
                 'product', 'product_name', 'favorite_type', 'created_at']
        read_only_fields = ['favorite_id', 'created_at']
    
    def validate(self, data):
        if data['favorite_type'] == 'restaurant' and not data.get('restaurant'):
            raise serializers.ValidationError("Restaurant is required for restaurant favorite")
        if data['favorite_type'] == 'product' and not data.get('product'):
            raise serializers.ValidationError("Product is required for product favorite")
        return data


class AnalyticsDailySerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsDaily
        fields = ['analytics_id', 'date', 'total_orders', 'total_revenue', 
                 'total_customers', 'new_customers', 'completed_orders', 
                 'cancelled_orders', 'average_order_value', 'created_at']
        read_only_fields = ['analytics_id', 'created_at']


class RestaurantAnalyticsSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    
    class Meta:
        model = RestaurantAnalytics
        fields = ['restaurant_analytics_id', 'restaurant', 'restaurant_name', 
                 'date', 'total_orders', 'total_revenue', 'completed_orders', 
                 'cancelled_orders', 'average_order_value', 'new_reviews', 
                 'created_at']
        read_only_fields = ['restaurant_analytics_id', 'created_at']


class ProductAnalyticsSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    
    class Meta:
        model = ProductAnalytics
        fields = ['product_analytics_id', 'product', 'product_name', 
                 'restaurant', 'restaurant_name', 'date', 'total_ordered', 
                 'total_quantity', 'total_revenue', 'created_at']
        read_only_fields = ['product_analytics_id', 'created_at']


# Authentication serializers moved to accounts app


class AppSettingsSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    banner_url = serializers.SerializerMethodField()
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = AppSettings
        fields = [
            'id', 'app_name', 'app_description', 'app_logo', 'app_banner',
            'logo_url', 'banner_url',
            'contact_email', 'contact_phone', 'contact_address',
            'hero_title', 'hero_subtitle',
            'feature_1_title', 'feature_1_description', 'feature_1_icon',
            'feature_2_title', 'feature_2_description', 'feature_2_icon',
            'feature_3_title', 'feature_3_description', 'feature_3_icon',
            'facebook_url', 'instagram_url', 'twitter_url',
            'meta_keywords', 'meta_description',
            'maintenance_mode', 'maintenance_message',
            'timezone', 'currency',
            'bank_name', 'bank_account_number', 'bank_account_name', 'qr_code_image', 'qr_code_url',
            'created_at', 'updated_at', 'updated_by'
        ]
        read_only_fields = ['id', 'logo_url', 'banner_url', 'qr_code_url', 'created_at', 'updated_at', 'updated_by']
    
    def get_logo_url(self, obj):
        if obj.app_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.app_logo.url)
            return obj.app_logo.url
        return None
    
    def get_banner_url(self, obj):
        if obj.app_banner:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.app_banner.url)
            return obj.app_banner.url
        return None
    
    def get_qr_code_url(self, obj):
        if obj.qr_code_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.qr_code_image.url)
            return obj.qr_code_image.url
        return None 