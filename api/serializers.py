from rest_framework import serializers
from accounts.models import User
from .models import (
    Restaurant, Category, Product, Order, OrderDetail,
    Payment, Review, ProductReview, DeliveryStatusLog, Notification,
    SearchHistory, PopularSearch, UserFavorite, AnalyticsDaily,
    RestaurantAnalytics, ProductAnalytics, AppSettings, Language, Translation,
    CategoryTranslation, ProductTranslation, GuestOrder, GuestOrderDetail, GuestDeliveryStatusLog,
    Advertisement
)


def get_absolute_image_url(image_url, request=None):
    """Helper function to get absolute image URL"""
    if image_url and not image_url.startswith('http'):
        if request:
            return request.build_absolute_uri(image_url)
        else:
            # Fallback: use settings or environment variable
            from django.conf import settings
            base_url = getattr(settings, 'BASE_URL', None)
            if not base_url:
                import os
                base_url = os.environ.get('BASE_URL', 'https://matjyp.com')
            return f"{base_url}{image_url}"
    return image_url


# User serializer moved to accounts app


class CategoryTranslationSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.code', read_only=True)
    language_name = serializers.CharField(source='language.name', read_only=True)
    
    class Meta:
        model = CategoryTranslation
        fields = ['language_code', 'language_name', 'translated_name', 'translated_description']


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)
    image_display_url = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['category_id', 'category_name', 'description', 'image', 'image_display_url', 'is_special_only', 'sort_order', 'products_count', 'translations']
    
    def get_image_display_url(self, obj):
        """Get the category image URL"""
        image_url = obj.get_image_url()
        return get_absolute_image_url(image_url, self.context.get('request'))
    
    def get_translations(self, obj):
        """
        Get translations, optionally filtered by language from query parameter
        ถ้ามี ?lang=th จะส่งแค่ translation ภาษาไทย
        ถ้าไม่มี จะส่งทุกภาษา (backward compatible)
        """
        request = self.context.get('request')
        if request:
            lang_code = request.query_params.get('lang', None)
            if lang_code:
                # ส่งแค่ภาษาที่ต้องการ (optimize performance)
                filtered_translations = obj.translations.filter(language__code=lang_code)
                return CategoryTranslationSerializer(filtered_translations, many=True).data
        
        # ส่งทุกภาษา (default behavior - backward compatible)
        return CategoryTranslationSerializer(obj.translations.all(), many=True).data

    def create(self, validated_data):
        """Custom create method to handle translations"""
        translations_data = self.context.get('request').data.get('translations')
        
        # สร้างหมวดหมู่
        category = Category.objects.create(**validated_data)
        
        # เพิ่มการแปล
        if translations_data:
            import json
            translations = json.loads(translations_data)
            for lang_code, translation_data in translations.items():
                if translation_data.get('name'):
                    try:
                        language = Language.objects.get(code=lang_code)
                        CategoryTranslation.objects.create(
                            category=category,
                            language=language,
                            translated_name=translation_data['name'],
                            translated_description=translation_data.get('description', '')
                        )
                    except Language.DoesNotExist:
                        pass
        
        return category

    def update(self, instance, validated_data):
        """Custom update method to handle translations"""
        translations_data = self.context.get('request').data.get('translations')
        
        # อัปเดตหมวดหมู่
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # อัปเดตการแปล
        if translations_data:
            import json
            translations = json.loads(translations_data)
            
            # อัปเดตหรือเพิ่มการแปลสำหรับแต่ละภาษา
            for lang_code, translation_data in translations.items():
                if translation_data.get('name'):
                    try:
                        language = Language.objects.get(code=lang_code)
                        translation, created = CategoryTranslation.objects.get_or_create(
                            category=instance,
                            language=language,
                            defaults={
                                'translated_name': translation_data['name'],
                                'translated_description': translation_data.get('description', '')
                            }
                        )
                        if not created:
                            # อัปเดตการแปลที่มีอยู่
                            translation.translated_name = translation_data['name']
                            translation.translated_description = translation_data.get('description', '')
                            translation.save()
                    except Language.DoesNotExist:
                        pass
        
        return instance


class ProductTranslationSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.code', read_only=True)
    language_name = serializers.CharField(source='language.name', read_only=True)
    
    class Meta:
        model = ProductTranslation
        fields = ['language_code', 'language_name', 'translated_name', 'translated_description']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    restaurant_id = serializers.IntegerField(source='restaurant.restaurant_id', read_only=True)
    restaurant_status = serializers.CharField(source='restaurant.status', read_only=True)
    image_display_url = serializers.SerializerMethodField()
    translations = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['product_id', 'restaurant', 'restaurant_id', 'restaurant_name', 'restaurant_status', 'category', 
                 'category_name', 'product_name', 'description', 'price', 
                 'image_url', 'image', 'image_display_url', 'is_available', 'created_at', 'updated_at', 'translations']
        read_only_fields = ['product_id', 'created_at', 'updated_at']
    
    def get_image_display_url(self, obj):
        """Get the best available image URL"""
        image_url = obj.get_image_url()
        return get_absolute_image_url(image_url, self.context.get('request'))
    
    def get_translations(self, obj):
        """
        Get translations, optionally filtered by language from query parameter
        ถ้ามี ?lang=th จะส่งแค่ translation ภาษาไทย
        ถ้าไม่มี จะส่งทุกภาษา (backward compatible)
        """
        request = self.context.get('request')
        if request:
            lang_code = request.query_params.get('lang', None)
            if lang_code:
                # ส่งแค่ภาษาที่ต้องการ (optimize performance)
                filtered_translations = obj.translations.filter(language__code=lang_code)
                return ProductTranslationSerializer(filtered_translations, many=True).data
        
        # ส่งทุกภาษา (default behavior - backward compatible)
        return ProductTranslationSerializer(obj.translations.all(), many=True).data
    
    def create(self, validated_data):
        """Custom create method to handle image upload and translations"""
        translations_data = validated_data.pop('translations', None)
        
        # สร้างสินค้า
        product = Product.objects.create(**validated_data)
        
        # เพิ่มการแปล
        if translations_data:
            for lang_code, translation_data in translations_data.items():
                if translation_data.get('name'):
                    try:
                        language = Language.objects.get(code=lang_code)
                        ProductTranslation.objects.create(
                            product=product,
                            language=language,
                            translated_name=translation_data['name'],
                            translated_description=translation_data.get('description', '')
                        )
                    except Language.DoesNotExist:
                        pass
        
        return product

    def update(self, instance, validated_data):
        """Custom update method to handle translations"""
        # Get translations data from request (for FormData) or validated_data (for JSON)
        translations_data = self.context.get('request').data.get('translations') if self.context.get('request') else validated_data.pop('translations', None)
        
        # Parse JSON string if needed
        if isinstance(translations_data, str):
            import json
            translations_data = json.loads(translations_data)
        
        # Debug logs
        print(f"🔄 ProductSerializer.update - Product ID: {instance.product_id}")
        print(f"📝 translations_data: {translations_data}")
        
        # อัปเดตสินค้า
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # อัปเดตการแปล
        if translations_data is not None:
            print(f"🔄 Processing {len(translations_data)} translations")
            # อัปเดตหรือเพิ่มการแปลสำหรับแต่ละภาษา
            for lang_code, translation_data in translations_data.items():
                if translation_data.get('name'):
                    try:
                        language = Language.objects.get(code=lang_code)
                        print(f"📝 Creating/updating translation for {lang_code}: {translation_data['name']}")
                        translation, created = ProductTranslation.objects.get_or_create(
                            product=instance,
                            language=language,
                            defaults={
                                'translated_name': translation_data['name'],
                                'translated_description': translation_data.get('description', '')
                            }
                        )
                        if not created:
                            # อัปเดตการแปลที่มีอยู่
                            print(f"🔄 Updating existing translation for {lang_code}")
                            translation.translated_name = translation_data['name']
                            translation.translated_description = translation_data.get('description', '')
                            translation.save()
                        else:
                            print(f"✅ Created new translation for {lang_code}")
                    except Language.DoesNotExist:
                        print(f"❌ Language {lang_code} does not exist")
                        pass
        else:
            print("❌ No translations_data provided")
        
        return instance


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
        return get_absolute_image_url(image_url, self.context.get('request'))
    
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
                # print(f"🔄 Auto-sync: Restaurant {instance.restaurant_name} is_special={validated_data['is_special']} → User {user.username} role={new_role}")
        
        return instance


class OrderDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_image_url = serializers.SerializerMethodField()
    image_display_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    restaurant_id = serializers.IntegerField(source='product.restaurant.restaurant_id', read_only=True)
    restaurant_name = serializers.CharField(source='product.restaurant.restaurant_name', read_only=True)
    
    class Meta:
        model = OrderDetail
        fields = ['order_detail_id', 'order', 'product', 'product_name', 'product_image_url',
                 'image_display_url', 'image_url', 'restaurant_id', 'restaurant_name', 
                 'quantity', 'price_at_order', 'subtotal']
        read_only_fields = ['order_detail_id', 'subtotal']
    
    def get_product_image_url(self, obj):
        """Get product image URL using the model's method"""
        image_url = obj.product.get_image_url()
        return get_absolute_image_url(image_url, self.context.get('request'))
    
    def get_image_display_url(self, obj):
        """Alias for compatibility"""
        return self.get_product_image_url(obj)
    
    def get_image_url(self, obj):
        """Alias for compatibility"""
        return self.get_product_image_url(obj)


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
    customer_phone = serializers.CharField(source='user.phone_number', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    restaurant_count = serializers.SerializerMethodField()
    is_multi_restaurant = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['order_id', 'user', 'customer_name', 'customer_phone', 'restaurant', 
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
            raise serializers.ValidationError("Must have at least 1 restaurant and must be a list")
        
        for i, restaurant_data in enumerate(value):
            # ตรวจสอบ structure ของแต่ละร้าน
            if not isinstance(restaurant_data, dict):
                raise serializers.ValidationError(f"Restaurant data at index {i+1} must be an object")
            
            if 'restaurant_id' not in restaurant_data:
                raise serializers.ValidationError(f"Restaurant {i+1}: restaurant_id is required")
            if 'items' not in restaurant_data:
                raise serializers.ValidationError(f"Restaurant {i+1}: items list is required")
            
            restaurant_id = restaurant_data.get('restaurant_id')
            items = restaurant_data.get('items')
            
            # ตรวจสอบ restaurant_id
            try:
                restaurant_id = int(restaurant_id)
                restaurant = Restaurant.objects.get(restaurant_id=restaurant_id)
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"Restaurant {i+1}: restaurant_id must be a number")
            except Restaurant.DoesNotExist:
                raise serializers.ValidationError(f"Restaurant not found with ID: {restaurant_id}")
            
            # ตรวจสอบ items
            if not isinstance(items, list) or not items:
                raise serializers.ValidationError(f"Restaurant {i+1}: must have at least 1 item in the list")
            
            # ตรวจสอบสินค้าในร้าน
            for j, item in enumerate(items):
                if not isinstance(item, dict):
                    raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: must be an object")
                
                if 'product_id' not in item or 'quantity' not in item:
                    raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: product_id and quantity are required")
                
                try:
                    product_id = int(item['product_id'])
                    quantity = int(item['quantity'])
                    
                    if quantity <= 0:
                        raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: quantity must be greater than 0")
                    
                    product = Product.objects.get(
                        product_id=product_id, 
                        restaurant=restaurant,
                        is_available=True
                    )
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: product_id and quantity must be numbers")
                except Product.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Product not found with ID: {product_id} in restaurant {restaurant.restaurant_name}"
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
    # ใช้ PrimaryKeyRelatedField กับ allow_null=True เพื่อป้องกัน error เมื่อ related object ถูกลบ
    related_order = serializers.PrimaryKeyRelatedField(read_only=True, allow_null=True)
    related_guest_order = serializers.PrimaryKeyRelatedField(read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = ['notification_id', 'user', 'title', 'message', 'type', 
                 'related_order', 'related_guest_order', 'is_read', 'created_at', 'read_at']
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
            'base_delivery_fee', 'free_delivery_minimum', 'max_delivery_distance', 'per_km_fee',
            'multi_restaurant_base_fee', 'multi_restaurant_additional_fee', 'delivery_time_slots',
            'enable_scheduled_delivery', 'rush_hour_multiplier', 'weekend_multiplier',
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


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'code', 'name', 'is_default', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class TranslationSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.code', read_only=True)
    
    class Meta:
        model = Translation
        fields = ['id', 'language', 'language_code', 'key', 'value', 'group', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at'] 

# Guest Order
class GuestOrderDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    product_image_url = serializers.SerializerMethodField()
    image_display_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    restaurant_id = serializers.IntegerField(source='restaurant.restaurant_id', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    translations = ProductTranslationSerializer(source='product.translations.all', many=True, read_only=True)

    class Meta:
        model = GuestOrderDetail
        fields = ['guest_order_detail_id', 'guest_order', 'product', 'product_name', 
                 'product_image_url', 'image_display_url', 'image_url', 'restaurant_id', 
                 'restaurant_name', 'quantity', 'price_at_order', 'subtotal', 'translations']
        read_only_fields = ['guest_order_detail_id', 'subtotal']
    
    def get_product_image_url(self, obj):
        """Get product image URL using the model's method"""
        image_url = obj.product.get_image_url()
        return get_absolute_image_url(image_url, self.context.get('request'))
    
    def get_image_display_url(self, obj):
        """Alias for compatibility"""
        return self.get_product_image_url(obj)
    
    def get_image_url(self, obj):
        """Alias for compatibility"""
        return self.get_product_image_url(obj)


class GuestOrderSerializer(serializers.ModelSerializer):
    order_details = GuestOrderDetailSerializer(many=True, read_only=True)
    order_details_by_restaurant = serializers.SerializerMethodField()
    restaurant_name = serializers.SerializerMethodField()
    status_logs = serializers.SerializerMethodField()
    restaurant_count = serializers.SerializerMethodField()
    is_multi_restaurant = serializers.SerializerMethodField()
    restaurants = serializers.SerializerMethodField()

    class Meta:
        model = GuestOrder
        fields = [
            'guest_order_id', 'temporary_id', 'restaurant', 'restaurants', 'restaurant_name',
            'order_date', 'total_amount', 'delivery_address', 'delivery_latitude',
            'delivery_longitude', 'current_status', 'delivery_fee',
            'estimated_delivery_time', 'customer_name', 'customer_phone',
            'customer_email', 'special_instructions', 'payment_method',
            'payment_status', 'proof_of_payment', 'expires_at', 'order_details',
            'order_details_by_restaurant', 'restaurant_count', 'is_multi_restaurant',
            'status_logs'
        ]
        read_only_fields = ['guest_order_id', 'temporary_id', 'order_date', 'expires_at']

    def get_restaurant_name(self, obj):
        """ดึงชื่อร้านหลักหรือชื่อร้านแรก"""
        if obj.is_multi_restaurant:
            restaurant_names = obj.get_restaurant_names()
            return restaurant_names[0] if restaurant_names else 'Multi-Restaurant Order'
        elif obj.restaurant:
            return obj.restaurant.restaurant_name
        return 'Unknown Restaurant'

    def get_restaurants(self, obj):
        """ดึงข้อมูลร้านทั้งหมด"""
        if obj.is_multi_restaurant:
            return obj.restaurants
        elif obj.restaurant:
            return [{
                'restaurant_id': obj.restaurant.restaurant_id,
                'restaurant_name': obj.restaurant.restaurant_name,
                'delivery_fee': float(obj.delivery_fee or 0)
            }]
        return []

    def get_status_logs(self, obj):
        logs = obj.status_logs.all().order_by('-timestamp')
        return [
            {
                'status': log.status,
                'timestamp': log.timestamp,
                'note': log.note,
                'updated_by': log.updated_by_user.username if log.updated_by_user else None
            }
            for log in logs
        ]

    def get_order_details_by_restaurant(self, obj):
        """จัดกลุ่ม OrderDetail ตามร้าน"""
        order_details = obj.order_details.all()
        restaurants = {}
        
        for detail in order_details:
            restaurant_id = detail.restaurant.restaurant_id
            restaurant_name = detail.restaurant.restaurant_name
            
            if restaurant_id not in restaurants:
                restaurants[restaurant_id] = {
                    'restaurant_id': restaurant_id,
                    'restaurant_name': restaurant_name,
                    'restaurant_address': detail.restaurant.address or '',
                    'items': [],
                    'subtotal': 0
                }
            
            item_data = GuestOrderDetailSerializer(detail).data
            restaurants[restaurant_id]['items'].append(item_data)
            restaurants[restaurant_id]['subtotal'] += float(detail.subtotal)
        
        return list(restaurants.values())
    
    def get_restaurant_count(self, obj):
        """นับจำนวนร้านในคำสั่งซื้อ"""
        return obj.restaurant_count
    
    def get_is_multi_restaurant(self, obj):
        """ตรวจสอบว่าเป็น multi-restaurant order หรือไม่"""
        return obj.is_multi_restaurant


class GuestMultiRestaurantOrderSerializer(serializers.Serializer):
    """
    Serializer สำหรับการสั่งซื้อจากหลายร้านในครั้งเดียว (Guest Order)
    ระบบจะสร้าง GuestOrder เดียวที่มี GuestOrderDetail จากหลายร้าน
    """
    delivery_address = serializers.CharField(max_length=255)
    delivery_latitude = serializers.DecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True)
    delivery_longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)
    total_delivery_fee = serializers.DecimalField(max_digits=10, decimal_places=2)
    customer_name = serializers.CharField(max_length=100)
    customer_phone = serializers.CharField(max_length=20)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    special_instructions = serializers.CharField(max_length=500, required=False, allow_blank=True)
    payment_method = serializers.CharField(max_length=20, default='bank_transfer')
    restaurants = serializers.JSONField(write_only=True)
    
    def validate_restaurants(self, value):
        """ตรวจสอบข้อมูลร้านและสินค้า"""
        if not isinstance(value, list) or not value:
            raise serializers.ValidationError("Must have at least 1 restaurant and must be a list")
        
        for i, restaurant_data in enumerate(value):
            # ตรวจสอบ structure ของแต่ละร้าน
            if not isinstance(restaurant_data, dict):
                raise serializers.ValidationError(f"Restaurant data at index {i+1} must be an object")
            
            if 'restaurant_id' not in restaurant_data:
                raise serializers.ValidationError(f"Restaurant {i+1}: restaurant_id is required")
            if 'items' not in restaurant_data:
                raise serializers.ValidationError(f"Restaurant {i+1}: items list is required")
            
            restaurant_id = restaurant_data.get('restaurant_id')
            items = restaurant_data.get('items')
            
            # ตรวจสอบ restaurant_id
            try:
                restaurant_id = int(restaurant_id)
                restaurant = Restaurant.objects.get(restaurant_id=restaurant_id)
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"Restaurant {i+1}: restaurant_id must be a number")
            except Restaurant.DoesNotExist:
                raise serializers.ValidationError(f"Restaurant not found with ID: {restaurant_id}")
            
            # ตรวจสอบ items
            if not isinstance(items, list) or not items:
                raise serializers.ValidationError(f"Restaurant {i+1}: must have at least 1 item in the list")
            
            # ตรวจสอบสินค้าในร้าน
            for j, item in enumerate(items):
                if not isinstance(item, dict):
                    raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: must be an object")
                
                if 'product_id' not in item or 'quantity' not in item:
                    raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: product_id and quantity are required")
                
                try:
                    product_id = int(item['product_id'])
                    quantity = int(item['quantity'])
                    
                    if quantity <= 0:
                        raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: quantity must be greater than 0")
                    
                    product = Product.objects.get(
                        product_id=product_id, 
                        restaurant=restaurant,
                        is_available=True
                    )
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f"Restaurant {i+1}, item {j+1}: product_id and quantity must be numbers")
                except Product.DoesNotExist:
                    raise serializers.ValidationError(
                        f"Product not found with ID: {product_id} in restaurant {restaurant.restaurant_name}"
                    )
        
        return value
    
    def create(self, validated_data):
        restaurants_data = validated_data.pop('restaurants')
        
        # คำนวณยอดรวม
        total_amount = validated_data.get('total_delivery_fee', 0)
        
        # เตรียมข้อมูลร้านสำหรับ JSONField
        restaurants_json = []
        
        for restaurant_data in restaurants_data:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_data['restaurant_id'])
            restaurant_subtotal = 0
            
            for item_data in restaurant_data['items']:
                product = Product.objects.get(product_id=item_data['product_id'])
                restaurant_subtotal += product.price * int(item_data['quantity'])
            
            total_amount += restaurant_subtotal
            
            # เพิ่มข้อมูลร้านลงใน JSON
            restaurants_json.append({
                'restaurant_id': restaurant.restaurant_id,
                'restaurant_name': restaurant.restaurant_name,
                'delivery_fee': float(restaurant_data.get('delivery_fee', 0))
            })
        
        # สร้าง GuestOrder
        guest_order = GuestOrder.objects.create(
            restaurants=restaurants_json,  # ใช้ JSONField ใหม่
            delivery_address=validated_data['delivery_address'],
            delivery_latitude=validated_data.get('delivery_latitude'),
            delivery_longitude=validated_data.get('delivery_longitude'),
            delivery_fee=validated_data['total_delivery_fee'],
            total_amount=total_amount,
            current_status='pending',
            customer_name=validated_data['customer_name'],
            customer_phone=validated_data['customer_phone'],
            customer_email=validated_data.get('customer_email', ''),
            special_instructions=validated_data.get('special_instructions', ''),
            payment_method=validated_data.get('payment_method', 'bank_transfer')
        )
        
        # สร้าง GuestOrderDetail สำหรับทุกสินค้าจากทุกร้าน
        for restaurant_data in restaurants_data:
            restaurant = Restaurant.objects.get(restaurant_id=restaurant_data['restaurant_id'])
            for item_data in restaurant_data['items']:
                product = Product.objects.get(product_id=item_data['product_id'])
                GuestOrderDetail.objects.create(
                    guest_order=guest_order,
                    product=product,
                    restaurant=restaurant,  # เพิ่ม restaurant field
                    quantity=int(item_data['quantity']),
                    price_at_order=product.price
                )
        
        # สร้าง status log
        GuestDeliveryStatusLog.objects.create(
            guest_order=guest_order,
            status='pending',
            note=f'Multi-restaurant guest order created with {len(restaurants_data)} restaurants'
        )
        
        return guest_order


class CreateGuestOrderSerializer(serializers.ModelSerializer):
    order_items = serializers.ListField(write_only=True)
    
    class Meta:
        model = GuestOrder
        fields = ['restaurant', 'delivery_address', 'delivery_latitude', 
                 'delivery_longitude', 'delivery_fee', 'customer_name', 
                 'customer_phone', 'customer_email', 'special_instructions', 
                 'payment_method', 'order_items', 'temporary_id']
        read_only_fields = ['temporary_id']
    
    def create(self, validated_data):
        order_items = validated_data.pop('order_items')
        
        # คำนวณยอดรวม
        total_amount = validated_data.get('delivery_fee', 0)
        restaurant = validated_data.get('restaurant')
        
        for item in order_items:
            product = Product.objects.get(product_id=item['product_id'])
            total_amount += product.price * item['quantity']
        
        validated_data['total_amount'] = total_amount
        guest_order = GuestOrder.objects.create(**validated_data)
        
        # สร้างรายละเอียดคำสั่งซื้อ
        for item in order_items:
            product = Product.objects.get(product_id=item['product_id'])
            GuestOrderDetail.objects.create(
                guest_order=guest_order,
                product=product,
                restaurant=product.restaurant,  # ใช้ restaurant จาก product
                quantity=item['quantity'],
                price_at_order=product.price
            )
        
        # สร้าง status log แรก
        GuestDeliveryStatusLog.objects.create(
            guest_order=guest_order,
            status='pending',
            note='Order created'
        )
        
        return guest_order


class GuestOrderTrackingSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.restaurant_name', read_only=True)
    order_details = GuestOrderDetailSerializer(many=True, read_only=True)
    order_details_by_restaurant = serializers.SerializerMethodField()
    status_logs = serializers.SerializerMethodField()
    restaurant_count = serializers.SerializerMethodField()
    is_multi_restaurant = serializers.SerializerMethodField()

    class Meta:
        model = GuestOrder
        fields = [
            'guest_order_id', 'temporary_id', 'restaurant_name', 'order_date',
            'total_amount', 'delivery_address', 'current_status', 'delivery_fee',
            'estimated_delivery_time', 'customer_name', 'order_details',
            'order_details_by_restaurant', 'restaurant_count', 'is_multi_restaurant',
            'status_logs'
        ]

    def get_status_logs(self, obj):
        logs = obj.status_logs.all().order_by('-timestamp')
        return [
            {
                'status': log.status,
                'timestamp': log.timestamp,
                'note': log.note,
                'updated_by': log.updated_by_user.username if log.updated_by_user else None
            }
            for log in logs
        ]

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
            
            item_data = GuestOrderDetailSerializer(detail).data
            restaurants[restaurant_id]['items'].append(item_data)
            restaurants[restaurant_id]['subtotal'] += float(detail.subtotal)
        
        return list(restaurants.values())
    
    def get_restaurant_count(self, obj):
        """นับจำนวนร้านในคำสั่งซื้อ"""
        return obj.order_details.values('product__restaurant').distinct().count()
    
    def get_is_multi_restaurant(self, obj):
        """ตรวจสอบว่าเป็น multi-restaurant order หรือไม่"""
        return self.get_restaurant_count(obj) > 1


class AdvertisementSerializer(serializers.ModelSerializer):
    image_display_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Advertisement
        fields = [
            'advertisement_id', 'image', 'image_display_url',
            'sort_order', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['advertisement_id', 'created_at', 'updated_at']
    
    def get_image_display_url(self, obj):
        """Get the advertisement image URL"""
        image_url = obj.get_image_url()
        return get_absolute_image_url(image_url, self.context.get('request'))